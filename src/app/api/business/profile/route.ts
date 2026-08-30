import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
const schema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  industry: z.string().trim().min(2).max(80),
  description: z.string().max(1000),
  preferredTone: z.string().max(40),
  defaultLanguage: z.string().max(40),
  signOff: z.string().max(120),
  phrasesToUse: z.string().max(500),
  phrasesToAvoid: z.string().max(500),
});
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  const business = await db.business.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!business)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.business.update({
    where: { id: business.id },
    data: {
      name: parsed.data.name,
      industry: parsed.data.industry,
      description: parsed.data.description,
      preferredTone: parsed.data.preferredTone,
      defaultLanguage: parsed.data.defaultLanguage,
      signOff: parsed.data.signOff,
      phrasesToUse: parsed.data.phrasesToUse,
      phrasesToAvoid: parsed.data.phrasesToAvoid,
    },
  });
  return NextResponse.json({ ok: true });
}
