import { getUsageSummary } from "@/lib/plans";
import { requireSession } from "@/lib/session";

export default async function UsagePage() {
  const session = await requireSession();
  const usage = await getUsageSummary(session.user.id);
  const percent =
    usage.generationLimit > 0
      ? Math.min(100, (usage.used / usage.generationLimit) * 100)
      : 0;
  return (
    <>
      <div>
        <p className="eyebrow">{usage.name} plan</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Usage</h1>
        <p className="mt-2 text-muted-foreground">
          AI generation allowance resets on{" "}
          {usage.resetAt.toLocaleDateString("en", {
            timeZone: "UTC",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          at 00:00 UTC.
        </p>
      </div>
      <div className="mt-8 max-w-xl rounded-2xl border bg-card p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              AI generations used
            </p>
            <p className="mt-2 text-4xl font-bold">
              {usage.used}
              <span className="text-lg text-muted-foreground">
                {" "}
                / {usage.generationLimit}
              </span>
            </p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">
            {usage.name}
          </span>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {usage.remaining} AI generations remaining this month.
        </p>
      </div>
    </>
  );
}
