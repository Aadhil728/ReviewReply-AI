import "server-only";
import { Prisma, UsageAction, UsageStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getUtcPeriod } from "@/lib/period";

const RESERVATION_TTL_MS = 10 * 60 * 1000;

export class UsageLimitError extends Error {
  constructor() {
    super("USAGE_LIMIT_REACHED");
  }
}

export class IdempotencyConflictError extends Error {
  constructor() {
    super("IDEMPOTENCY_CONFLICT");
  }
}

async function serializable<T>(
  work: (transaction: Prisma.TransactionClient) => Promise<T>,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      )
        continue;
      throw error;
    }
  }
  throw new Error("TRANSACTION_RETRY_EXHAUSTED");
}

export async function reserveGeneration(input: {
  userId: string;
  requestKey: string;
  action: UsageAction;
  limit: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const period = getUtcPeriod(now);
  return serializable(async (transaction) => {
    const existing = await transaction.usageEvent.findUnique({
      where: { requestKey: input.requestKey },
    });
    if (existing) {
      if (existing.userId !== input.userId)
        throw new IdempotencyConflictError();
      return { event: existing, duplicate: true };
    }

    await transaction.usageEvent.updateMany({
      where: {
        userId: input.userId,
        period,
        status: UsageStatus.RESERVED,
        expiresAt: { lte: now },
      },
      data: {
        status: UsageStatus.RELEASED,
        failureCategory: "RESERVATION_EXPIRED",
      },
    });
    const usage = await transaction.usageRecord.upsert({
      where: { userId_period: { userId: input.userId, period } },
      create: { userId: input.userId, period, generationsUsed: 0 },
      update: { updatedAt: now },
    });
    const reserved = await transaction.usageEvent.count({
      where: {
        userId: input.userId,
        period,
        status: UsageStatus.RESERVED,
        expiresAt: { gt: now },
      },
    });
    if (usage.generationsUsed + reserved >= input.limit)
      throw new UsageLimitError();
    const event = await transaction.usageEvent.create({
      data: {
        userId: input.userId,
        requestKey: input.requestKey,
        period,
        action: input.action,
        expiresAt: new Date(now.getTime() + RESERVATION_TTL_MS),
      },
    });
    return { event, duplicate: false };
  });
}

export async function releaseGeneration(
  eventId: string,
  failureCategory: string,
) {
  await db.usageEvent.updateMany({
    where: { id: eventId, status: UsageStatus.RESERVED },
    data: { status: UsageStatus.RELEASED, failureCategory },
  });
}

export async function completeGeneration(input: {
  eventId: string;
  userId: string;
  period: string;
  generation: Omit<
    Prisma.ReviewGenerationUncheckedCreateInput,
    "id" | "createdAt" | "updatedAt"
  >;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}) {
  return serializable(async (transaction) => {
    const event = await transaction.usageEvent.findFirst({
      where: {
        id: input.eventId,
        userId: input.userId,
        status: UsageStatus.RESERVED,
      },
    });
    if (!event) throw new Error("RESERVATION_NOT_ACTIVE");
    const generation = await transaction.reviewGeneration.create({
      data: input.generation,
    });
    const changed = await transaction.usageEvent.updateMany({
      where: {
        id: input.eventId,
        userId: input.userId,
        status: UsageStatus.RESERVED,
      },
      data: {
        status: UsageStatus.COMPLETED,
        generationId: generation.id,
        provider: input.provider,
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens: input.totalTokens,
      },
    });
    if (changed.count === 1) {
      await transaction.usageRecord.upsert({
        where: {
          userId_period: { userId: input.userId, period: input.period },
        },
        create: {
          userId: input.userId,
          period: input.period,
          generationsUsed: 1,
        },
        update: { generationsUsed: { increment: 1 } },
      });
    }
    const usage = await transaction.usageRecord.findUniqueOrThrow({
      where: { userId_period: { userId: input.userId, period: input.period } },
    });
    return { generation, usage };
  });
}
