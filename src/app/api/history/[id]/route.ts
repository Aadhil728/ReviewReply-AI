import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z
    .object({ finalResponse: z.string().trim().min(1).max(5000) })
    .safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid response" }, { status: 400 });
  const { id } = await params;
  const updated = await db.reviewGeneration.updateMany({
    where: { id, userId: session.user.id },
    data: parsed.data,
  });
  if (!updated.count)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const deleted = await db.reviewGeneration.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (!deleted.count)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
