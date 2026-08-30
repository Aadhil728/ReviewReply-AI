import { BillingProvider } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/billing";
import { db } from "@/lib/db";

const schema = z.object({
  planId: z.string().min(1),
  provider: z.enum([BillingProvider.STRIPE, BillingProvider.PAYPAL]),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose a valid plan and payment provider." },
      { status: 400 },
    );
  const mapping = await db.providerPrice.findUnique({
    where: { planId_provider: parsed.data },
    include: { plan: true },
  });
  if (!mapping?.isActive || !mapping.plan.isActive || !mapping.externalPriceId)
    return NextResponse.json(
      { error: "This plan is not configured for the selected provider." },
      { status: 409 },
    );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const checkout = await getPaymentProvider(
      parsed.data.provider,
    ).createCheckout({
      userId: session.user.id,
      email: session.user.email,
      planId: mapping.planId,
      externalPriceId: mapping.externalPriceId,
      returnUrl: `${appUrl}/dashboard/settings?billing=return`,
      cancelUrl: `${appUrl}/dashboard/settings?billing=canceled`,
    });
    return NextResponse.json(checkout);
  } catch {
    return NextResponse.json(
      {
        error: "Checkout could not be created. Contact the site administrator.",
      },
      { status: 503 },
    );
  }
}
