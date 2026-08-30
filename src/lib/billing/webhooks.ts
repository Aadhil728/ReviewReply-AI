import "server-only";
import {
  BillingProvider,
  Prisma,
  SubscriptionStatus,
  WebhookStatus,
} from "@prisma/client";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/encryption";

export type SubscriptionUpdate = {
  provider: BillingProvider;
  externalEventId: string;
  eventType: string;
  payload: string;
  userId: string;
  planId: string;
  externalSubscriptionId: string;
  externalCustomerId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  occurredAt?: Date;
};
type StoredUpdate = Omit<
  SubscriptionUpdate,
  "payload" | "currentPeriodStart" | "currentPeriodEnd" | "occurredAt"
> & {
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  occurredAt?: string;
};

function serializeUpdate(update: SubscriptionUpdate): StoredUpdate {
  return {
    provider: update.provider,
    externalEventId: update.externalEventId,
    eventType: update.eventType,
    userId: update.userId,
    planId: update.planId,
    externalSubscriptionId: update.externalSubscriptionId,
    externalCustomerId: update.externalCustomerId,
    status: update.status,
    currentPeriodStart: update.currentPeriodStart?.toISOString(),
    currentPeriodEnd: update.currentPeriodEnd?.toISOString(),
    cancelAtPeriodEnd: update.cancelAtPeriodEnd,
    occurredAt: update.occurredAt?.toISOString(),
  };
}

function deserializeUpdate(value: string): SubscriptionUpdate {
  const stored = JSON.parse(decryptSecret(value)) as StoredUpdate;
  return {
    ...stored,
    payload: "INTERNAL_RETRY",
    currentPeriodStart: stored.currentPeriodStart
      ? new Date(stored.currentPeriodStart)
      : undefined,
    currentPeriodEnd: stored.currentPeriodEnd
      ? new Date(stored.currentPeriodEnd)
      : undefined,
    occurredAt: stored.occurredAt ? new Date(stored.occurredAt) : undefined,
  };
}

async function applySubscriptionUpdate(
  update: SubscriptionUpdate,
  webhookId: string,
) {
  const current = await db.subscription.findUnique({
    where: { userId: update.userId },
    select: { providerUpdatedAt: true },
  });
  if (
    current?.providerUpdatedAt &&
    update.occurredAt &&
    current.providerUpdatedAt > update.occurredAt
  ) {
    await db.webhookEvent.update({
      where: { id: webhookId },
      data: {
        status: WebhookStatus.PROCESSED,
        processedAt: new Date(),
        errorMessage: null,
      },
    });
    return { duplicate: false, stale: true };
  }
  const gracePeriodEnd =
    update.status === SubscriptionStatus.PAST_DUE
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      : null;
  await db.$transaction([
    db.subscription.upsert({
      where: { userId: update.userId },
      create: {
        userId: update.userId,
        planId: update.planId,
        provider: update.provider,
        status: update.status,
        externalSubscriptionId: update.externalSubscriptionId,
        externalCustomerId: update.externalCustomerId,
        currentPeriodStart: update.currentPeriodStart,
        currentPeriodEnd: update.currentPeriodEnd,
        gracePeriodEnd,
        cancelAtPeriodEnd: update.cancelAtPeriodEnd ?? false,
        providerUpdatedAt: update.occurredAt,
      },
      update: {
        planId: update.planId,
        provider: update.provider,
        status: update.status,
        externalSubscriptionId: update.externalSubscriptionId,
        externalCustomerId: update.externalCustomerId,
        currentPeriodStart: update.currentPeriodStart,
        currentPeriodEnd: update.currentPeriodEnd,
        gracePeriodEnd,
        cancelAtPeriodEnd: update.cancelAtPeriodEnd ?? false,
        providerUpdatedAt: update.occurredAt,
      },
    }),
    db.webhookEvent.update({
      where: { id: webhookId },
      data: {
        status: WebhookStatus.PROCESSED,
        processedAt: new Date(),
        errorMessage: null,
      },
    }),
  ]);
  return { duplicate: false };
}

export async function processSubscriptionUpdate(update: SubscriptionUpdate) {
  const payloadHash = createHash("sha256").update(update.payload).digest("hex");
  let webhookId: string;
  try {
    const webhook = await db.webhookEvent.create({
      data: {
        provider: update.provider,
        externalEventId: update.externalEventId,
        eventType: update.eventType,
        payloadHash,
        payloadEncrypted: encryptSecret(
          JSON.stringify(serializeUpdate(update)),
        ),
        occurredAt: update.occurredAt,
      },
    });
    webhookId = webhook.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return { duplicate: true };
    throw error;
  }
  try {
    return await applySubscriptionUpdate(update, webhookId);
  } catch (error) {
    await db.webhookEvent.update({
      where: { id: webhookId },
      data: {
        status: WebhookStatus.FAILED,
        errorMessage:
          error instanceof Error ? error.message.slice(0, 200) : "UNKNOWN",
      },
    });
    throw error;
  }
}

export async function retryWebhookEvent(id: string) {
  const webhook = await db.webhookEvent.findUnique({ where: { id } });
  if (!webhook?.payloadEncrypted)
    throw new Error("WEBHOOK_RETRY_PAYLOAD_UNAVAILABLE");
  await db.webhookEvent.update({
    where: { id },
    data: { status: WebhookStatus.RECEIVED, errorMessage: null },
  });
  try {
    return await applySubscriptionUpdate(
      deserializeUpdate(webhook.payloadEncrypted),
      id,
    );
  } catch (error) {
    await db.webhookEvent.update({
      where: { id },
      data: {
        status: WebhookStatus.FAILED,
        errorMessage:
          error instanceof Error ? error.message.slice(0, 200) : "UNKNOWN",
      },
    });
    throw error;
  }
}
