import { BillingProvider } from "@prisma/client";
import { paypalAdapter } from "@/lib/billing/paypal";
import { stripeAdapter } from "@/lib/billing/stripe";

export function getPaymentProvider(provider: BillingProvider) {
  if (provider === BillingProvider.STRIPE) return stripeAdapter;
  if (provider === BillingProvider.PAYPAL) return paypalAdapter;
  throw new Error("MANUAL_PROVIDER_HAS_NO_CHECKOUT_ADAPTER");
}
