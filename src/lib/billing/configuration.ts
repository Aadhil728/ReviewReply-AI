import "server-only";
import { getSystemSetting } from "@/lib/settings";

export async function getStripeConfiguration() {
  const secretKey =
    (await getSystemSetting("stripe.secretKey")) ||
    process.env.STRIPE_SECRET_KEY;
  const webhookSecret =
    (await getSystemSetting("stripe.webhookSecret")) ||
    process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey) throw new Error("STRIPE_NOT_CONFIGURED");
  return { secretKey, webhookSecret };
}

export async function getPayPalConfiguration() {
  const clientId =
    (await getSystemSetting("paypal.clientId")) || process.env.PAYPAL_CLIENT_ID;
  const clientSecret =
    (await getSystemSetting("paypal.clientSecret")) ||
    process.env.PAYPAL_CLIENT_SECRET;
  const webhookId =
    (await getSystemSetting("paypal.webhookId")) ||
    process.env.PAYPAL_WEBHOOK_ID;
  const baseUrl =
    (await getSystemSetting("paypal.baseUrl")) ||
    process.env.PAYPAL_BASE_URL ||
    "https://api-m.sandbox.paypal.com";
  if (!clientId || !clientSecret) throw new Error("PAYPAL_NOT_CONFIGURED");
  return {
    clientId,
    clientSecret,
    webhookId,
    baseUrl: baseUrl.replace(/\/$/, ""),
  };
}
