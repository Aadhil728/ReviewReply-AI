import { BillingProvider, Prisma, SubscriptionStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; provider?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = Object.values(SubscriptionStatus).includes(
    params.status as SubscriptionStatus,
  )
    ? (params.status as SubscriptionStatus)
    : undefined;
  const provider = Object.values(BillingProvider).includes(
    params.provider as BillingProvider,
  )
    ? (params.provider as BillingProvider)
    : undefined;
  const where: Prisma.SubscriptionWhereInput = {
    ...(status ? { status } : {}),
    ...(provider ? { provider } : {}),
    ...(query
      ? {
          user: {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };
  const subscriptions = await db.subscription.findMany({
    where,
    include: { user: true, plan: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return (
    <>
      <div>
        <p className="eyebrow">Revenue operations</p>
        <h1 className="mt-2 text-3xl font-bold">Subscriptions</h1>
        <p className="mt-2 text-muted-foreground">
          Provider webhooks control these states. Checkout redirects never grant
          access.
        </p>
      </div>
      <form className="mt-6 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search customer"
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.values(SubscriptionStatus).map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          name="provider"
          defaultValue={provider ?? ""}
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        >
          <option value="">All providers</option>
          {Object.values(BillingProvider).map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      <div className="mt-5 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Status</th>
              <th className="p-4">Period end</th>
              <th className="p-4">Grace</th>
              <th className="p-4">Updated</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="border-b last:border-0">
                <td className="p-4">
                  <p className="font-semibold">{subscription.user.name}</p>
                  <p className="text-muted-foreground">
                    {subscription.user.email}
                  </p>
                </td>
                <td className="p-4">{subscription.plan.name}</td>
                <td className="p-4">{subscription.provider ?? "—"}</td>
                <td className="p-4">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">
                    {subscription.status}
                  </span>
                </td>
                <td className="p-4">
                  {subscription.currentPeriodEnd?.toLocaleDateString() ?? "—"}
                </td>
                <td className="p-4">
                  {subscription.gracePeriodEnd?.toLocaleDateString() ?? "—"}
                </td>
                <td className="p-4 text-muted-foreground">
                  {subscription.updatedAt.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscriptions.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No subscriptions match these filters.
          </p>
        )}
      </div>
    </>
  );
}
