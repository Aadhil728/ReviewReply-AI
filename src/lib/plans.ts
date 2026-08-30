import "server-only";
import { PlanCode } from "@prisma/client";
import { db } from "@/lib/db";
import { hasPaidEntitlements } from "@/lib/entitlement-rules";
import { getNextUtcReset, getUtcPeriod } from "@/lib/period";

export const DEFAULT_PLAN_ENTITLEMENTS = {
  FREE: { name: "Free", generationLimit: 10, businessLimit: 1 },
  PRO: { name: "Pro", generationLimit: 200, businessLimit: 1 },
  AGENCY: { name: "Agency", generationLimit: 1000, businessLimit: 10 },
} as const;

export async function getUserEntitlements(userId: string, now = new Date()) {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  const paid =
    subscription &&
    hasPaidEntitlements(
      subscription.status,
      subscription.currentPeriodEnd,
      subscription.gracePeriodEnd,
      now,
    );
  const selected = paid
    ? subscription.plan
    : await db.plan.findUnique({ where: { code: PlanCode.FREE } });
  const fallback = DEFAULT_PLAN_ENTITLEMENTS.FREE;
  return {
    code: selected?.code ?? PlanCode.FREE,
    name: selected?.name ?? fallback.name,
    generationLimit: selected?.generationLimit ?? fallback.generationLimit,
    businessLimit: selected?.businessLimit ?? fallback.businessLimit,
    period: getUtcPeriod(now),
    resetAt: getNextUtcReset(now),
  };
}

export async function getUsageSummary(userId: string, now = new Date()) {
  const entitlements = await getUserEntitlements(userId, now);
  const usage = await db.usageRecord.findUnique({
    where: { userId_period: { userId, period: entitlements.period } },
  });
  const used = usage?.generationsUsed ?? 0;
  return {
    ...entitlements,
    used,
    remaining: Math.max(0, entitlements.generationLimit - used),
  };
}
