import { SubscriptionStatus } from "@prisma/client";

export function hasPaidEntitlements(
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
  gracePeriodEnd: Date | null,
  now: Date,
) {
  if (
    status === SubscriptionStatus.ACTIVE ||
    status === SubscriptionStatus.TRIALING
  )
    return true;
  if (status === SubscriptionStatus.PAST_DUE)
    return Boolean(gracePeriodEnd && gracePeriodEnd > now);
  if (status === SubscriptionStatus.CANCELED)
    return Boolean(currentPeriodEnd && currentPeriodEnd > now);
  return false;
}
