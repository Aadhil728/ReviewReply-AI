import "server-only";
import { BillingProvider } from "@prisma/client";
import { getStripeConfiguration } from "@/lib/billing/configuration";
import type {
  CheckoutInput,
  PaymentProviderAdapter,
} from "@/lib/billing/types";

export const stripeAdapter: PaymentProviderAdapter = {
  provider: BillingProvider.STRIPE,
  async createCheckout(input: CheckoutInput) {
    const { secretKey } = await getStripeConfiguration();
    const body = new URLSearchParams({
      mode: "subscription",
      success_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.email,
      client_reference_id: input.userId,
      "line_items[0][price]": input.externalPriceId,
      "line_items[0][quantity]": "1",
      "metadata[userId]": input.userId,
      "metadata[planId]": input.planId,
      "subscription_data[metadata][userId]": input.userId,
      "subscription_data[metadata][planId]": input.planId,
    });
    const response = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${secretKey}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );
    const data = (await response.json()) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };
    if (!response.ok || !data.id || !data.url)
      throw new Error("STRIPE_CHECKOUT_FAILED");
    return { externalId: data.id, url: data.url };
  },
};
