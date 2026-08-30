import { WebhookStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { recordAdminAction } from "@/lib/admin-audit";
import { retryWebhookEvent } from "@/lib/billing/webhooks";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

async function retryWebhook(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  try {
    await retryWebhookEvent(id);
    await recordAdminAction({
      actorId: session.user.id,
      action: "WEBHOOK_RETRIED",
      targetType: "WebhookEvent",
      targetId: id,
    });
  } catch {
    redirect(
      "/admin/webhooks?error=Webhook retry failed. Older events may not contain a retry payload.",
    );
  }
  redirect("/admin/webhooks?notice=Webhook processed successfully.");
}

export default async function AdminWebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const status = Object.values(WebhookStatus).includes(
    params.status as WebhookStatus,
  )
    ? (params.status as WebhookStatus)
    : undefined;
  const events = await db.webhookEvent.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <div>
        <p className="eyebrow">Payment operations</p>
        <h1 className="mt-2 text-3xl font-bold">Webhooks</h1>
        <p className="mt-2 text-muted-foreground">
          Inspect provider events without exposing their signed payloads or
          customer secrets.
        </p>
      </div>
      <AdminNotice notice={params.notice} error={params.error} />
      <form className="mt-6 flex gap-3 rounded-2xl border bg-card p-4">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.values(WebhookStatus).map((value) => (
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
              <th className="p-4">Provider</th>
              <th className="p-4">Event</th>
              <th className="p-4">Status</th>
              <th className="p-4">Occurred</th>
              <th className="p-4">Error</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b last:border-0">
                <td className="p-4 font-semibold">{event.provider}</td>
                <td className="p-4">
                  <p>{event.eventType}</p>
                  <p className="max-w-52 truncate text-xs text-muted-foreground">
                    {event.externalEventId}
                  </p>
                </td>
                <td className="p-4">{event.status}</td>
                <td className="p-4 text-muted-foreground">
                  {(event.occurredAt ?? event.createdAt).toLocaleString()}
                </td>
                <td className="max-w-64 p-4 text-xs text-destructive">
                  {event.errorMessage ?? "—"}
                </td>
                <td className="p-4">
                  {event.status === WebhookStatus.FAILED && (
                    <form action={retryWebhook}>
                      <input type="hidden" name="id" value={event.id} />
                      <ConfirmSubmitButton
                        name="retry"
                        value="yes"
                        message="Retry this normalized webhook event?"
                      >
                        Retry
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No webhook events found.
          </p>
        )}
      </div>
    </>
  );
}
