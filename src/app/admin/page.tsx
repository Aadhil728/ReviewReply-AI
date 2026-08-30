import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [
    users,
    activeSubscriptions,
    generations,
    failedWebhooks,
    installation,
    tokenUsage,
    costSettings,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
    }),
    db.usageEvent.count({ where: { status: "COMPLETED" } }),
    db.webhookEvent.count({ where: { status: "FAILED" } }),
    db.installationState.findUnique({ where: { id: "primary" } }),
    db.usageEvent.aggregate({
      where: { status: "COMPLETED" },
      _sum: { inputTokens: true, outputTokens: true },
    }),
    db.systemSetting.findMany({
      where: {
        key: { in: ["ai.inputCostPerMillion", "ai.outputCostPerMillion"] },
      },
    }),
  ]);
  const costs = new Map(
    costSettings.map((setting) => [setting.key, Number(setting.value) || 0]),
  );
  const estimatedCost =
    ((tokenUsage._sum.inputTokens ?? 0) *
      (costs.get("ai.inputCostPerMillion") ?? 0) +
      (tokenUsage._sum.outputTokens ?? 0) *
        (costs.get("ai.outputCostPerMillion") ?? 0)) /
    1_000_000;
  const cards = [
    ["Users", String(users)],
    ["Paid subscriptions", String(activeSubscriptions)],
    ["AI generations", String(generations)],
    ["Estimated AI cost", `$${estimatedCost.toFixed(2)}`],
    ["Failed webhooks", String(failedWebhooks)],
  ] as const;
  return (
    <>
      <div>
        <p className="eyebrow">SaaS owner</p>
        <h1 className="mt-2 text-3xl font-bold">Administration</h1>
        <p className="mt-2 text-muted-foreground">
          Manage this ReviewReply AI installation without exposing provider
          secrets.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <section key={label} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-2xl border bg-card p-6">
        <h2 className="font-bold">System status</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Installation</dt>
            <dd className="mt-1 font-semibold">
              {installation?.installed ? "Complete" : "Not completed"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Application version</dt>
            <dd className="mt-1 font-semibold">
              {installation?.version ??
                process.env.npm_package_version ??
                "0.1.0"}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex gap-3">
          <Link
            className="text-sm font-semibold text-primary"
            href="/api/health"
          >
            Open health check
          </Link>
          {failedWebhooks > 0 && (
            <Link
              className="text-sm font-semibold text-destructive"
              href="/admin"
            >
              Review webhook failures
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
