import "server-only";
import { BillingProvider, Plan } from "@prisma/client";
import { getStripeConfiguration } from "@/lib/billing/configuration";
import { getPayPalAccessToken } from "@/lib/billing/paypal";
import { db } from "@/lib/db";

export async function syncPlanToProvider(
  plan: Plan,
  provider: BillingProvider,
) {
  if (plan.monthlyPriceCents <= 0) throw new Error("FREE_PLAN_CANNOT_SYNC");
  if (provider === BillingProvider.STRIPE) {
    const configuration = await getStripeConfiguration();
    const productResponse = await fetch("https://api.stripe.com/v1/products", {
      method: "POST",
      headers: {
        authorization: `Bearer ${configuration.secretKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        name: plan.name,
        "metadata[planId]": plan.id,
      }),
    });
    const product = (await productResponse.json()) as { id?: string };
    if (!productResponse.ok || !product.id)
      throw new Error("STRIPE_PRODUCT_SYNC_FAILED");
    const priceResponse = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: {
        authorization: `Bearer ${configuration.secretKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        product: product.id,
        currency: "usd",
        unit_amount: String(plan.monthlyPriceCents),
        "recurring[interval]": "month",
        "metadata[planId]": plan.id,
      }),
    });
    const price = (await priceResponse.json()) as { id?: string };
    if (!priceResponse.ok || !price.id)
      throw new Error("STRIPE_PRICE_SYNC_FAILED");
    return db.providerPrice.upsert({
      where: { planId_provider: { planId: plan.id, provider } },
      create: {
        planId: plan.id,
        provider,
        externalProductId: product.id,
        externalPriceId: price.id,
      },
      update: {
        externalProductId: product.id,
        externalPriceId: price.id,
        isActive: true,
      },
    });
  }
  const configuration = await getPayPalAccessToken();
  const productResponse = await fetch(
    `${configuration.baseUrl}/v1/catalogs/products`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${configuration.accessToken}`,
        "content-type": "application/json",
        "paypal-request-id": `product-${plan.id}`,
      },
      body: JSON.stringify({
        name: plan.name,
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    },
  );
  const product = (await productResponse.json()) as { id?: string };
  if (!productResponse.ok || !product.id)
    throw new Error("PAYPAL_PRODUCT_SYNC_FAILED");
  const planResponse = await fetch(
    `${configuration.baseUrl}/v1/billing/plans`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${configuration.accessToken}`,
        "content-type": "application/json",
        "paypal-request-id": `plan-${plan.id}-${plan.monthlyPriceCents}`,
      },
      body: JSON.stringify({
        product_id: product.id,
        name: plan.name,
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: (plan.monthlyPriceCents / 100).toFixed(2),
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 1,
        },
      }),
    },
  );
  const externalPlan = (await planResponse.json()) as { id?: string };
  if (!planResponse.ok || !externalPlan.id)
    throw new Error("PAYPAL_PLAN_SYNC_FAILED");
  return db.providerPrice.upsert({
    where: { planId_provider: { planId: plan.id, provider } },
    create: {
      planId: plan.id,
      provider,
      externalProductId: product.id,
      externalPriceId: externalPlan.id,
    },
    update: {
      externalProductId: product.id,
      externalPriceId: externalPlan.id,
      isActive: true,
    },
  });
}
