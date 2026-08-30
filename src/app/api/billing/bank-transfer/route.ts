import { PaymentRequestStatus } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSystemSetting } from "@/lib/settings";

const schema = z.object({
  planId: z.string().min(1),
  transferReference: z.string().trim().max(120).optional(),
  customerNote: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  if ((await getSystemSetting("bank.enabled")) !== "true")
    return NextResponse.json(
      { error: "Bank transfer is not currently available." },
      { status: 409 },
    );
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose a valid plan." },
      { status: 400 },
    );
  const plan = await db.plan.findFirst({
    where: {
      id: parsed.data.planId,
      isActive: true,
      monthlyPriceCents: { gt: 0 },
    },
  });
  if (!plan)
    return NextResponse.json(
      { error: "This plan is unavailable." },
      { status: 404 },
    );
  const existing = await db.bankTransferRequest.findFirst({
    where: { userId: session.user.id, status: PaymentRequestStatus.PENDING },
  });
  if (existing)
    return NextResponse.json(
      { error: "You already have a bank-transfer request awaiting review." },
      { status: 409 },
    );
  const paymentRequest = await db.bankTransferRequest.create({
    data: {
      userId: session.user.id,
      planId: plan.id,
      transferReference: parsed.data.transferReference || null,
      customerNote: parsed.data.customerNote || null,
    },
  });
  return NextResponse.json({ ok: true, requestId: paymentRequest.id });
}
