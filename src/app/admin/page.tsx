import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  CreditCard,
  HeartPulse,
  Landmark,
  Settings2,
  Users,
  Webhook,
} from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const quickActions = [
  {
    href: "/admin/users",
    label: "Manage users",
    description: "Roles, access, and account status",
    icon: Users,
  },
  {
    href: "/admin/plans",
    label: "Plans and billing",
    description: "Limits, pricing, and provider mappings",
    icon: CreditCard,
  },
  {
    href: "/admin/settings",
    label: "Configure product",
    description: "Branding, AI, email, and payments",
    icon: Settings2,
  },
  {
    href: "/admin/audit",
    label: "Review activity",
    description: "Trace administrator changes",
    icon: Activity,
  },
] as const;

export default async function AdminOverview() {
  const [
    users,
    activeSubscriptions,
    generations,
    failedWebhooks,
    pendingTransfers,
    installation,
    tokenUsage,
    settings,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
    }),
    db.usageEvent.count({ where: { status: "COMPLETED" } }),
    db.webhookEvent.count({ where: { status: "FAILED" } }),
    db.bankTransferRequest.count({ where: { status: "PENDING" } }),
    db.installationState.findUnique({ where: { id: "primary" } }),
    db.usageEvent.aggregate({
      where: { status: "COMPLETED" },
      _sum: { inputTokens: true, outputTokens: true },
    }),
    db.systemSetting.findMany({
      where: {
        key: {
          in: [
            "ai.inputCostPerMillion",
            "ai.outputCostPerMillion",
            "branding.productName",
          ],
        },
      },
    }),
  ]);

  const settingValues = new Map(
    settings.map((setting) => [setting.key, setting.value]),
  );
  const inputCost = Number(settingValues.get("ai.inputCostPerMillion")) || 0;
  const outputCost = Number(settingValues.get("ai.outputCostPerMillion")) || 0;
  const estimatedCost =
    ((tokenUsage._sum.inputTokens ?? 0) * inputCost +
      (tokenUsage._sum.outputTokens ?? 0) * outputCost) /
    1_000_000;
  const productName =
    settingValues.get("branding.productName") || "ReviewReply AI";
  const needsAttention = failedWebhooks + pendingTransfers;
  const version =
    installation?.version ?? process.env.npm_package_version ?? "0.1.0";

  const metrics = [
    {
      label: "Users",
      value: users.toLocaleString(),
      detail: "Registered accounts",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Paid subscriptions",
      value: activeSubscriptions.toLocaleString(),
      detail: "Active or trialing",
      href: "/admin/subscriptions",
      icon: CreditCard,
    },
    {
      label: "AI generations",
      value: generations.toLocaleString(),
      detail: "Completed requests",
      href: "/admin/audit",
      icon: Bot,
    },
    {
      label: "Estimated AI cost",
      value: `$${estimatedCost.toFixed(2)}`,
      detail: "Based on configured rates",
      href: "/admin/settings#ai",
      icon: CircleDollarSign,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">SaaS owner</p>
          <h1 className="mt-2 text-3xl font-bold">Administration</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor {productName} and reach common management tasks quickly.
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
            needsAttention > 0
              ? "bg-warning/10 text-warning"
              : "bg-success/10 text-success"
          }`}
        >
          <span className="size-2 rounded-full bg-current" />
          {needsAttention > 0
            ? `${needsAttention} item${needsAttention === 1 ? "" : "s"} need attention`
            : "Operations healthy"}
        </span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
        {metrics.map(({ label, value, detail, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
            </div>
            <p className="mt-5 text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-12" aria-label="Administration shortcuts">
        <div className="rounded-2xl border bg-card p-5 sm:p-6 lg:col-span-8">
          <div>
            <p className="text-lg font-bold">Quick management</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open the areas used most often by the product owner.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {quickActions.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-4 rounded-xl border bg-background p-4 transition hover:border-primary/35 hover:bg-accent/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                </span>
                <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 sm:p-6 lg:col-span-4">
          <p className="text-lg font-bold">Needs attention</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational items waiting for review.
          </p>
          <div className="mt-5 space-y-3">
            <Link
              href="/admin/webhooks"
              className="flex items-center gap-3 rounded-xl bg-muted/70 p-4 transition hover:bg-accent"
            >
              <Webhook className="size-5 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Failed webhooks</span>
                <span className="block text-xs text-muted-foreground">Retry or inspect delivery errors</span>
              </span>
              <strong className={failedWebhooks > 0 ? "text-destructive" : "text-success"}>{failedWebhooks}</strong>
            </Link>
            <Link
              href="/admin/bank-transfers"
              className="flex items-center gap-3 rounded-xl bg-muted/70 p-4 transition hover:bg-accent"
            >
              <Landmark className="size-5 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Bank approvals</span>
                <span className="block text-xs text-muted-foreground">Verify pending payment requests</span>
              </span>
              <strong className={pendingTransfers > 0 ? "text-warning" : "text-success"}>{pendingTransfers}</strong>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 sm:p-6 lg:col-span-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
                <HeartPulse className="size-6" />
              </span>
              <div>
                <p className="font-bold">System status</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Installation {installation?.installed ? "complete" : "incomplete"} ? Version {version}
                </p>
              </div>
            </div>
            <Link
              href="/api/health"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:border-primary/35 hover:bg-accent"
            >
              Open health check
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
