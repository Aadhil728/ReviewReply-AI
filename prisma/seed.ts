import { PlanCode, PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const plans = [
  {
    id: "plan_free",
    code: PlanCode.FREE,
    name: "Free",
    generationLimit: 10,
    businessLimit: 1,
    monthlyPriceCents: 0,
    sortOrder: 0,
  },
  {
    id: "plan_pro",
    code: PlanCode.PRO,
    name: "Pro",
    generationLimit: 200,
    businessLimit: 1,
    monthlyPriceCents: 1900,
    sortOrder: 1,
  },
  {
    id: "plan_agency",
    code: PlanCode.AGENCY,
    name: "Agency",
    generationLimit: 1000,
    businessLimit: 10,
    monthlyPriceCents: 4900,
    sortOrder: 2,
  },
];

async function main() {
  for (const plan of plans) {
    await db.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: plan,
    });
  }
  await db.installationState.upsert({
    where: { id: "primary" },
    create: { id: "primary", installed: false },
    update: {},
  });
  console.log("Default plans are ready. Development accounts remain opt-in.");
}

main().finally(() => db.$disconnect());
