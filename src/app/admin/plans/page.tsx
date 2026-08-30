import { BillingProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { recordAdminAction } from "@/lib/admin-audit";
import { syncPlanToProvider } from "@/lib/billing/sync-plan";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

const planSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(40),
  generationLimit: z.coerce.number().int().min(1).max(1_000_000),
  businessLimit: z.coerce.number().int().min(1).max(10_000),
  monthlyPriceCents: z.coerce.number().int().min(0).max(100_000_000),
});

async function savePlan(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect("/admin/plans?error=Check the plan values and try again.");
  const { id, ...data } = parsed.data;
  const plan = await db.plan.update({ where: { id }, data });
  const operation = String(formData.get("operation") ?? "save");
  try {
    if (operation === "stripe")
      await syncPlanToProvider(plan, BillingProvider.STRIPE);
    if (operation === "paypal")
      await syncPlanToProvider(plan, BillingProvider.PAYPAL);
  } catch {
    redirect(
      `/admin/plans?error=${encodeURIComponent(`${operation === "paypal" ? "PayPal" : "Stripe"} synchronization failed. Check provider credentials.`)}`,
    );
  }
  await recordAdminAction({
    actorId: session.user.id,
    action: operation === "save" ? "PLAN_UPDATED" : "PLAN_PROVIDER_SYNCED",
    targetType: "Plan",
    targetId: plan.id,
    metadata: {
      provider: operation,
      generationLimit: plan.generationLimit,
      businessLimit: plan.businessLimit,
      monthlyPriceCents: plan.monthlyPriceCents,
    },
  });
  revalidatePath("/admin/plans");
  redirect("/admin/plans?notice=Plan configuration saved.");
}

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const plans = await db.plan.findMany({
    include: { providerPrices: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <>
      <div>
        <p className="eyebrow">Entitlements</p>
        <h1 className="mt-2 text-3xl font-bold">Plans</h1>
        <p className="mt-2 text-muted-foreground">
          Internal entitlements remain separate from Stripe and PayPal price
          identifiers.
        </p>
      </div>
      <AdminNotice notice={params.notice} error={params.error} />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <form
            action={savePlan}
            key={plan.id}
            className="rounded-2xl border bg-card p-5"
          >
            <input type="hidden" name="id" value={plan.id} />
            <p className="eyebrow">{plan.code}</p>
            <label className="mt-4 block text-sm font-semibold">
              Name
              <input
                name="name"
                defaultValue={plan.name}
                className="mt-2 h-10 w-full rounded-xl border bg-background px-3 font-normal"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Monthly AI generations
              <input
                type="number"
                name="generationLimit"
                defaultValue={plan.generationLimit}
                className="mt-2 h-10 w-full rounded-xl border bg-background px-3 font-normal"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Businesses
              <input
                type="number"
                name="businessLimit"
                defaultValue={plan.businessLimit}
                className="mt-2 h-10 w-full rounded-xl border bg-background px-3 font-normal"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Monthly price in cents
              <input
                type="number"
                name="monthlyPriceCents"
                defaultValue={plan.monthlyPriceCents}
                className="mt-2 h-10 w-full rounded-xl border bg-background px-3 font-normal"
              />
            </label>
            <p className="mt-4 text-xs text-muted-foreground">
              Provider mappings: {plan.providerPrices.length}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="submit" name="operation" value="save">
                Save
              </Button>
              {plan.code !== "FREE" && (
                <>
                  <Button
                    variant="secondary"
                    type="submit"
                    name="operation"
                    value="stripe"
                  >
                    Sync Stripe
                  </Button>
                  <Button
                    variant="secondary"
                    type="submit"
                    name="operation"
                    value="paypal"
                  >
                    Sync PayPal
                  </Button>
                </>
              )}
            </div>
          </form>
        ))}
      </div>
    </>
  );
}
