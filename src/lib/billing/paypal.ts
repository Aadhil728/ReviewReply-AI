import "server-only";
import { BillingProvider } from "@prisma/client";
import { getPayPalConfiguration } from "@/lib/billing/configuration";
import type {
  CheckoutInput,
  PaymentProviderAdapter,
} from "@/lib/billing/types";

export async function getPayPalAccessToken() {
  const configuration = await getPayPalConfiguration();
  const basic = Buffer.from(
    `${configuration.clientId}:${configuration.clientSecret}`,
  ).toString("base64");
  const response = await fetch(`${configuration.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await response.json()) as { access_token?: string };
  if (!response.ok || !data.access_token) throw new Error("PAYPAL_AUTH_FAILED");
  return { ...configuration, accessToken: data.access_token };
}

export const paypalAdapter: PaymentProviderAdapter = {
  provider: BillingProvider.PAYPAL,
  async createCheckout(input: CheckoutInput) {
    const configuration = await getPayPalAccessToken();
    const response = await fetch(
      `${configuration.baseUrl}/v1/billing/subscriptions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${configuration.accessToken}`,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          plan_id: input.externalPriceId,
          custom_id: Buffer.from(
            JSON.stringify({ userId: input.userId, planId: input.planId }),
          ).toString("base64url"),
          application_context: {
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
            user_action: "SUBSCRIBE_NOW",
          },
        }),
      },
    );
    const data = (await response.json()) as {
      id?: string;
      links?: Array<{ rel: string; href: string }>;
    };
    const url = data.links?.find((link) => link.rel === "approve")?.href;
    if (!response.ok || !data.id || !url)
      throw new Error("PAYPAL_CHECKOUT_FAILED");
    return { externalId: data.id, url };
  },
};
