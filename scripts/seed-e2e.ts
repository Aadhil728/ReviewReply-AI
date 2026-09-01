import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const databaseUrl = process.env.DATABASE_URL ?? "";
const explicitlyAllowed = process.env.E2E_ALLOW_NON_TEST_DATABASE === "true";

if (!databaseUrl.toLowerCase().includes("e2e") && !explicitlyAllowed) {
  throw new Error(
    "E2E seed refused: DATABASE_URL must contain 'e2e'. Set E2E_ALLOW_NON_TEST_DATABASE=true only for a deliberately isolated database.",
  );
}

const db = new PrismaClient();
const password = process.env.E2E_USER_PASSWORD ?? "ReviewReply-E2E-2026!";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? password;

const accounts = [
  {
    id: "e2e-user",
    accountId: "e2e-user",
    name: "E2E Customer",
    email: process.env.E2E_USER_EMAIL ?? "customer@reviewreply-e2e.local",
    password,
    role: UserRole.USER,
    business: {
      id: "e2e-business-user",
      name: "E2E Cafe",
      industry: "Restaurant",
    },
  },
  {
    id: "e2e-admin",
    accountId: "e2e-admin",
    name: "E2E Administrator",
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@reviewreply-e2e.local",
    password: adminPassword,
    role: UserRole.ADMIN,
    business: {
      id: "e2e-business-admin",
      name: "E2E Admin Business",
      industry: "Software",
    },
  },
] as const;

async function seedAccount(account: (typeof accounts)[number]) {
  const passwordHash = await hashPassword(account.password);

  await db.user.upsert({
    where: { email: account.email },
    create: {
      id: account.id,
      name: account.name,
      email: account.email,
      emailVerified: true,
      role: account.role,
      isActive: true,
    },
    update: {
      name: account.name,
      emailVerified: true,
      role: account.role,
      isActive: true,
    },
  });

  await db.account.upsert({
    where: {
      issuer_accountId: {
        issuer: "local:credential",
        accountId: account.accountId,
      },
    },
    create: {
      id: `account-${account.id}`,
      issuer: "local:credential",
      accountId: account.accountId,
      providerId: "credential",
      userId: account.id,
      password: passwordHash,
    },
    update: {
      providerId: "credential",
      userId: account.id,
      password: passwordHash,
    },
  });

  await db.business.upsert({
    where: { id: account.business.id },
    create: {
      id: account.business.id,
      userId: account.id,
      name: account.business.name,
      industry: account.business.industry,
    },
    update: {
      userId: account.id,
      name: account.business.name,
      industry: account.business.industry,
    },
  });
}

async function main() {
  for (const account of accounts) await seedAccount(account);

  await db.installationState.upsert({
    where: { id: "primary" },
    create: {
      id: "primary",
      installed: true,
      installedAt: new Date(),
      version: process.env.npm_package_version ?? "0.1.0",
    },
    update: {
      installed: true,
      installedAt: new Date(),
      version: process.env.npm_package_version ?? "0.1.0",
    },
  });

  const settings = [
    ["bank.enabled", "bank", "true"],
    ["bank.name", "bank", "E2E National Bank"],
    ["bank.accountName", "bank", "ReviewReply E2E"],
    ["bank.accountNumber", "bank", "000000001"],
    ["branding.productName", "branding", "ReviewReply AI"],
    ["ai.inputCostPerMillion", "ai", "0"],
    ["ai.outputCostPerMillion", "ai", "0"],
  ] as const;

  for (const [key, group, value] of settings) {
    await db.systemSetting.upsert({
      where: { key },
      create: { key, group, value },
      update: { group, value, encrypted: false },
    });
  }

  console.log("E2E customer and administrator accounts are ready.");
}

main()
  .finally(() => db.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
