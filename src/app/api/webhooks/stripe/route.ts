import { createHmac, timingSafeEqual } from "node:crypto";
import { BillingProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { getStripeConfiguration } from "@/lib/billing/configuration";
import { normalizeStripeStatus } from "@/lib/billing/types";
import { processSubscriptionUpdate } from "@/lib/billing/webhooks";

type StripeEvent = {
  id: string;
  type: string;
  created?: number;
  data: {
    object: {
      id: string;
      customer?: string;
      status?: string;
      current_period_start?: number;
      current_period_end?: number;
      cancel_at_period_end?: boolean;
      metadata?: { userId?: string; planId?: string };
    };
  };
};

function verify(payload: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts
    .filter(([key]) => key === "v1")
    .map(([, value]) => value);
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300)
    return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return signatures.some(
    (signature) =>
      signature.length === expected.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expected)),
  );
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const configuration = await getStripeConfiguration();
  if (
    !configuration.webhookSecret ||
    !verify(payload, signature, configuration.webhookSecret)
  )
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  const event = JSON.parse(payload) as StripeEvent;
  if (!event.type.startsWith("customer.subscription."))
    return NextResponse.json({ received: true });
  const subscription = event.data.object;
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId;
  if (!userId || !planId || !subscription.status)
    return NextResponse.json(
      { error: "Subscription metadata is incomplete." },
      { status: 400 },
    );
  await processSubscriptionUpdate({
    provider: BillingProvider.STRIPE,
    externalEventId: event.id,
    eventType: event.type,
    payload,
    userId,
    planId,
    externalSubscriptionId: subscription.id,
    externalCustomerId: subscription.customer,
    status: normalizeStripeStatus(subscription.status),
    currentPeriodStart: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : undefined,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : undefined,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    occurredAt: event.created ? new Date(event.created * 1000) : undefined,
  });
  return NextResponse.json({ received: true });
}
