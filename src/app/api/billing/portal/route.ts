import { BillingProvider } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripeConfiguration } from "@/lib/billing/configuration";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!subscription?.provider)
    return NextResponse.json(
      { error: "No paid subscription was found." },
      { status: 404 },
    );
  if (subscription.provider === BillingProvider.PAYPAL)
    return NextResponse.json({
      url: "https://www.paypal.com/myaccount/autopay/",
    });
  if (subscription.provider === BillingProvider.BANK_TRANSFER)
    return NextResponse.json(
      { error: "Manual subscriptions are managed by the site administrator." },
      { status: 409 },
    );
  if (!subscription.externalCustomerId)
    return NextResponse.json(
      { error: "The Stripe customer record is incomplete." },
      { status: 409 },
    );
  const configuration = await getStripeConfiguration();
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings`;
  const response = await fetch(
    "https://api.stripe.com/v1/billing_portal/sessions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${configuration.secretKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: subscription.externalCustomerId,
        return_url: returnUrl,
      }),
    },
  );
  const data = (await response.json()) as { url?: string };
  if (!response.ok || !data.url)
    return NextResponse.json(
      { error: "The billing portal is unavailable." },
      { status: 503 },
    );
  return NextResponse.json({ url: data.url });
}
