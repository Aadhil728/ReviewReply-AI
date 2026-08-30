import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserEntitlements } from "@/lib/plans";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  industry: z.string().trim().min(2).max(80),
  preferredTone: z.string().max(30),
  defaultLanguage: z.string().max(30),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid business profile" },
      { status: 400 },
    );
  const entitlements = await getUserEntitlements(session.user.id);
  const business = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`business-limit:${session.user.id}`}))`;
    const businessCount = await tx.business.count({
      where: { userId: session.user.id },
    });
    if (businessCount >= entitlements.businessLimit) return null;
    return tx.business.create({
      data: { ...parsed.data, userId: session.user.id },
    });
  });
  if (!business)
    return NextResponse.json(
      { error: "Your plan's business limit has been reached." },
      { status: 403 },
    );
  return NextResponse.json({ business });
}
