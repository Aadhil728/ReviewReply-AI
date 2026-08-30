import { timingSafeEqual } from "node:crypto";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { PlanCode, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEnvironmentStatus } from "@/lib/env";
import { setSystemSetting } from "@/lib/settings";

const schema = z
  .object({
    installationToken: z.string().min(16),
    name: z.string().trim().min(2).max(80),
    email: z.email(),
    password: z.string().min(8).max(128),
    productName: z.string().trim().min(2).max(80).default("ReviewReply AI"),
    companyName: z.string().trim().min(2).max(80).default("Aara Creations"),
    contactEmail: z.email(),
    aiApiKey: z.string().min(1),
    aiBaseUrl: z.url().default("https://api.openai.com/v1"),
    aiModel: z.string().trim().min(1).max(100).default("gpt-5-mini"),
    smtpHost: z.string().trim().max(255).optional().default(""),
    smtpPort: z.coerce.number().int().min(1).max(65535).optional().default(587),
    smtpSecure: z.union([z.literal("on"), z.literal("")]).optional(),
    smtpUser: z.string().trim().max(255).optional().default(""),
    smtpPassword: z.string().max(500).optional().default(""),
    smtpFromEmail: z
      .union([z.literal(""), z.email()])
      .optional()
      .default(""),
  })
  .superRefine((value, context) => {
    const emailValues = [
      value.smtpHost,
      value.smtpUser,
      value.smtpPassword,
      value.smtpFromEmail,
    ];
    if (emailValues.some(Boolean) && !emailValues.every(Boolean))
      context.addIssue({
        code: "custom",
        path: ["smtpHost"],
        message:
          "Complete every SMTP field or leave the optional email section empty.",
      });
  });

function validToken(received: string) {
  const expected = process.env.INSTALLATION_TOKEN ?? "";
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return (
    left.length === right.length &&
    left.length > 0 &&
    timingSafeEqual(left, right)
  );
}

export async function GET() {
  try {
    const [state, database, migrations] = await Promise.all([
      db.installationState.findUnique({ where: { id: "primary" } }),
      db.$queryRaw`SELECT 1`,
      db.$queryRaw<
        Array<{ count: bigint }>
      >`SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL`,
    ]);
    let writableStorage = true;
    try {
      await access(tmpdir(), constants.W_OK);
    } catch {
      writableStorage = false;
    }
    const environment = getEnvironmentStatus();
    return NextResponse.json({
      installed: state?.installed ?? false,
      checks: {
        node: process.versions.node,
        database: Boolean(database),
        migrations: Number(migrations[0]?.count ?? 0),
        writableStorage,
        environment: environment.valid,
        missingEnvironment: environment.missing,
      },
    });
  } catch {
    return NextResponse.json(
      {
        installed: false,
        checks: {
          node: process.versions.node,
          database: false,
          environment: false,
        },
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid installation request." },
      { status: 400 },
    );
  }
  const parsed = schema.safeParse(input);
  if (
    !parsed.success ||
    !validToken(parsed.success ? parsed.data.installationToken : "")
  )
    return NextResponse.json(
      { error: "The installation token or form values are invalid." },
      { status: 403 },
    );
  const environment = getEnvironmentStatus();
  if (!environment.valid)
    return NextResponse.json(
      {
        error: `Required environment values are missing: ${environment.missing.join(", ")}`,
      },
      { status: 503 },
    );
  const state = await db.installationState.upsert({
    where: { id: "primary" },
    create: { id: "primary" },
    update: {},
  });
  if (state.installed)
    return NextResponse.json(
      {
        error:
          "The installer is permanently locked. Reopening requires a server-side maintenance procedure.",
      },
      { status: 423 },
    );
  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  let adminUser: { id: string; email: string };
  if (existing) {
    if (existing.role !== UserRole.ADMIN)
      return NextResponse.json(
        {
          error:
            "Only an existing administrator can reconfigure an installation.",
        },
        { status: 403 },
      );
    try {
      const signedIn = await auth.api.signInEmail({
        body: { email: parsed.data.email, password: parsed.data.password },
      });
      adminUser = { id: signedIn.user.id, email: signedIn.user.email };
    } catch {
      return NextResponse.json(
        { error: "The administrator credentials are invalid." },
        { status: 403 },
      );
    }
  } else {
    const created = await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
    adminUser = { id: created.user.id, email: created.user.email };
  }
  await db.$transaction([
    db.user.update({
      where: { id: adminUser.id },
      data: { role: UserRole.ADMIN, emailVerified: true },
    }),
    db.plan.upsert({
      where: { code: PlanCode.FREE },
      create: {
        id: "plan_free",
        code: PlanCode.FREE,
        name: "Free",
        generationLimit: 10,
        businessLimit: 1,
        monthlyPriceCents: 0,
        sortOrder: 0,
      },
      update: {},
    }),
    db.plan.upsert({
      where: { code: PlanCode.PRO },
      create: {
        id: "plan_pro",
        code: PlanCode.PRO,
        name: "Pro",
        generationLimit: 200,
        businessLimit: 1,
        monthlyPriceCents: 1900,
        sortOrder: 1,
      },
      update: {},
    }),
    db.plan.upsert({
      where: { code: PlanCode.AGENCY },
      create: {
        id: "plan_agency",
        code: PlanCode.AGENCY,
        name: "Agency",
        generationLimit: 1000,
        businessLimit: 10,
        monthlyPriceCents: 4900,
        sortOrder: 2,
      },
      update: {},
    }),
  ]);
  await Promise.all([
    setSystemSetting(
      "branding.productName",
      "branding",
      parsed.data.productName,
    ),
    setSystemSetting(
      "branding.companyName",
      "branding",
      parsed.data.companyName,
    ),
    setSystemSetting(
      "branding.contactEmail",
      "branding",
      parsed.data.contactEmail,
    ),
    setSystemSetting("ai.apiKey", "ai", parsed.data.aiApiKey),
    setSystemSetting("ai.baseUrl", "ai", parsed.data.aiBaseUrl),
    setSystemSetting("ai.model", "ai", parsed.data.aiModel),
    ...(parsed.data.smtpHost &&
    parsed.data.smtpUser &&
    parsed.data.smtpPassword &&
    parsed.data.smtpFromEmail
      ? [
          setSystemSetting("email.smtpHost", "email", parsed.data.smtpHost),
          setSystemSetting(
            "email.smtpPort",
            "email",
            String(parsed.data.smtpPort),
          ),
          setSystemSetting(
            "email.smtpSecure",
            "email",
            String(parsed.data.smtpSecure === "on"),
          ),
          setSystemSetting("email.smtpUser", "email", parsed.data.smtpUser),
          setSystemSetting(
            "email.smtpPassword",
            "email",
            parsed.data.smtpPassword,
          ),
          setSystemSetting("email.fromName", "email", parsed.data.productName),
          setSystemSetting(
            "email.fromAddress",
            "email",
            parsed.data.smtpFromEmail,
          ),
        ]
      : []),
  ]);
  await db.installationState.update({
    where: { id: "primary" },
    data: {
      installed: true,
      installedAt: new Date(),
      version: process.env.npm_package_version ?? "0.1.0",
    },
  });
  return NextResponse.json({ ok: true, adminEmail: adminUser.email });
}
