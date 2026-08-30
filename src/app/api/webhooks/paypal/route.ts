import { BillingProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPayPalConfiguration } from "@/lib/billing/configuration";
import { getPayPalAccessToken } from "@/lib/billing/paypal";
import { normalizePayPalStatus } from "@/lib/billing/types";
import { processSubscriptionUpdate } from "@/lib/billing/webhooks";
import { db } from "@/lib/db";

type PayPalEvent = {
  id: string;
  event_type: string;
  create_time?: string;
  resource: {
    id: string;
    plan_id?: string;
    custom_id?: string;
    status?: string;
    subscriber?: { payer_id?: string };
    start_time?: string;
    billing_info?: { next_billing_time?: string };
  };
};

export async function POST(request: Request) {
  const payload = await request.text();
  const event = JSON.parse(payload) as PayPalEvent;
  const configuration = await getPayPalConfiguration();
  if (!configuration.webhookId)
    return NextResponse.json(
      { error: "PayPal webhook verification is not configured." },
      { status: 503 },
    );
  const auth = await getPayPalAccessToken();
  const verification = await fetch(
    `${configuration.baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${auth.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: request.headers.get("paypal-auth-algo"),
        cert_url: request.headers.get("paypal-cert-url"),
        transmission_id: request.headers.get("paypal-transmission-id"),
        transmission_sig: request.headers.get("paypal-transmission-sig"),
        transmission_time: request.headers.get("paypal-transmission-time"),
        webhook_id: configuration.webhookId,
        webhook_event: event,
      }),
    },
  );
  const verified = (await verification.json()) as {
    verification_status?: string;
  };
  if (!verification.ok || verified.verification_status !== "SUCCESS")
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  if (!event.event_type.startsWith("BILLING.SUBSCRIPTION."))
    return NextResponse.json({ received: true });
  let userId: string | undefined;
  let planId: string | undefined;
  if (event.resource.custom_id) {
    try {
      const custom = JSON.parse(
        Buffer.from(event.resource.custom_id, "base64url").toString("utf8"),
      ) as { userId?: string; planId?: string };
      userId = custom.userId;
      planId = custom.planId;
    } catch {
      /* Fall back to provider mapping. */
    }
  }
  if (!planId && event.resource.plan_id)
    planId = (
      await db.providerPrice.findFirst({
        where: {
          provider: BillingProvider.PAYPAL,
          externalPriceId: event.resource.plan_id,
        },
      })
    )?.planId;
  if (!userId || !planId || !event.resource.status)
    return NextResponse.json(
      { error: "Subscription metadata is incomplete." },
      { status: 400 },
    );
  await processSubscriptionUpdate({
    provider: BillingProvider.PAYPAL,
    externalEventId: event.id,
    eventType: event.event_type,
    payload,
    userId,
    planId,
    externalSubscriptionId: event.resource.id,
    externalCustomerId: event.resource.subscriber?.payer_id,
    status: normalizePayPalStatus(event.resource.status),
    currentPeriodStart: event.resource.start_time
      ? new Date(event.resource.start_time)
      : undefined,
    currentPeriodEnd: event.resource.billing_info?.next_billing_time
      ? new Date(event.resource.billing_info.next_billing_time)
      : undefined,
    occurredAt: event.create_time ? new Date(event.create_time) : undefined,
  });
  return NextResponse.json({ received: true });
}
