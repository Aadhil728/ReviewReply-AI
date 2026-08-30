import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  installationToken: z.string().min(16),
  confirmation: z.literal("REOPEN INSTALLER"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  const expected = Buffer.from(process.env.INSTALLATION_TOKEN ?? "");
  const received = Buffer.from(
    parsed.success ? parsed.data.installationToken : "",
  );
  if (
    !parsed.success ||
    expected.length === 0 ||
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  )
    return NextResponse.json(
      { error: "Invalid reopening request." },
      { status: 403 },
    );
  await db.installationState.upsert({
    where: { id: "primary" },
    create: { id: "primary", installed: false },
    update: { installed: false },
  });
  return NextResponse.json({
    ok: true,
    message:
      "Installer reopened. Complete it immediately, then rotate the installation token.",
  });
}
