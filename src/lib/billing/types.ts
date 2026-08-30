import { BillingProvider, SubscriptionStatus } from "@prisma/client";

export type CheckoutInput = {
  userId: string;
  email: string;
  planId: string;
  externalPriceId: string;
  returnUrl: string;
  cancelUrl: string;
};
export type CheckoutResult = { url: string; externalId: string };

export interface PaymentProviderAdapter {
  provider: BillingProvider;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
}

export function normalizeStripeStatus(status: string): SubscriptionStatus {
  const value = status.toLowerCase();
  if (value === "active") return SubscriptionStatus.ACTIVE;
  if (value === "trialing") return SubscriptionStatus.TRIALING;
  if (value === "past_due") return SubscriptionStatus.PAST_DUE;
  if (value === "canceled") return SubscriptionStatus.CANCELED;
  if (value === "unpaid") return SubscriptionStatus.UNPAID;
  return SubscriptionStatus.EXPIRED;
}

export function normalizePayPalStatus(status: string): SubscriptionStatus {
  const value = status.toUpperCase();
  if (value === "ACTIVE") return SubscriptionStatus.ACTIVE;
  if (value === "APPROVAL_PENDING" || value === "APPROVED")
    return SubscriptionStatus.TRIALING;
  if (value === "SUSPENDED") return SubscriptionStatus.PAST_DUE;
  if (value === "CANCELLED") return SubscriptionStatus.CANCELED;
  if (value === "EXPIRED") return SubscriptionStatus.EXPIRED;
  return SubscriptionStatus.UNPAID;
}
