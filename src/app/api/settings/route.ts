import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  defaultLength: z.enum(["SHORT", "MEDIUM", "DETAILED"]),
  defaultLanguage: z.string().min(2).max(30),
});

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose valid preferences." },
      { status: 400 },
    );
  await db.user.update({ where: { id: session.user.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
