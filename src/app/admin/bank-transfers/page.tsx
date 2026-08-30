import {
  BillingProvider,
  PaymentRequestStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { recordAdminAction } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

async function reviewTransfer(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const operation = String(formData.get("operation") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "")
    .trim()
    .slice(0, 500);
  if (!requestId || (operation !== "approve" && operation !== "reject"))
    redirect("/admin/bank-transfers?error=Invalid review request.");
  const result = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`bank-transfer:${requestId}`}))`;
    const payment = await tx.bankTransferRequest.findUnique({
      where: { id: requestId },
      include: { plan: true },
    });
    if (!payment || payment.status !== PaymentRequestStatus.PENDING)
      return false;
    const now = new Date();
    if (operation === "approve") {
      const periodEnd = new Date(now);
      periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
      await tx.subscription.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          planId: payment.planId,
          status: SubscriptionStatus.ACTIVE,
          provider: BillingProvider.BANK_TRANSFER,
          externalSubscriptionId: payment.id,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          providerUpdatedAt: now,
        },
        update: {
          planId: payment.planId,
          status: SubscriptionStatus.ACTIVE,
          provider: BillingProvider.BANK_TRANSFER,
          externalCustomerId: null,
          externalSubscriptionId: payment.id,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          gracePeriodEnd: null,
          cancelAtPeriodEnd: false,
          providerUpdatedAt: now,
        },
      });
    }
    await tx.bankTransferRequest.update({
      where: { id: payment.id },
      data: {
        status:
          operation === "approve"
            ? PaymentRequestStatus.APPROVED
            : PaymentRequestStatus.REJECTED,
        adminNote: adminNote || null,
        reviewedById: session.user.id,
        reviewedAt: now,
      },
    });
    return true;
  });
  if (!result)
    redirect(
      "/admin/bank-transfers?error=This request has already been reviewed.",
    );
  await recordAdminAction({
    actorId: session.user.id,
    action:
      operation === "approve"
        ? "BANK_TRANSFER_APPROVED"
        : "BANK_TRANSFER_REJECTED",
    targetType: "BankTransferRequest",
    targetId: requestId,
    metadata: { adminNote },
  });
  revalidatePath("/dashboard/settings");
  redirect(
    `/admin/bank-transfers?notice=Bank transfer ${operation === "approve" ? "approved" : "rejected"}.`,
  );
}

export default async function AdminBankTransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const status = Object.values(PaymentRequestStatus).includes(
    params.status as PaymentRequestStatus,
  )
    ? (params.status as PaymentRequestStatus)
    : PaymentRequestStatus.PENDING;
  const requests = await db.bankTransferRequest.findMany({
    where: { status },
    include: { user: true, plan: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <div>
        <p className="eyebrow">Manual payments</p>
        <h1 className="mt-2 text-3xl font-bold">Bank transfers</h1>
        <p className="mt-2 text-muted-foreground">
          Verify funds in your bank account before approving access. Customer
          submissions never activate a plan automatically.
        </p>
      </div>
      <AdminNotice notice={params.notice} error={params.error} />
      <form className="mt-6">
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        >
          {Object.values(PaymentRequestStatus).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </form>
      <div className="mt-5 space-y-4">
        {requests.map((request) => (
          <article key={request.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="font-bold">
                  {request.user.name} · {request.plan.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {request.user.email} · $
                  {(request.plan.monthlyPriceCents / 100).toFixed(2)} ·{" "}
                  {request.createdAt.toLocaleString()}
                </p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {request.status}
              </span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Transfer reference</dt>
                <dd className="font-semibold">
                  {request.transferReference || "Not supplied"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Customer note</dt>
                <dd>{request.customerNote || "No note"}</dd>
              </div>
            </dl>
            {request.status === PaymentRequestStatus.PENDING ? (
              <form action={reviewTransfer} className="mt-4 space-y-3">
                <input type="hidden" name="requestId" value={request.id} />
                <textarea
                  name="adminNote"
                  maxLength={500}
                  rows={2}
                  placeholder="Internal review note (optional)"
                  className="w-full rounded-xl border bg-background p-3 text-sm"
                />
                <div className="flex gap-2">
                  <ConfirmSubmitButton
                    name="operation"
                    value="approve"
                    message={`Confirm that the transfer from ${request.user.email} has reached the bank account?`}
                  >
                    Approve and activate
                  </ConfirmSubmitButton>
                  <ConfirmSubmitButton
                    name="operation"
                    value="reject"
                    variant="ghost"
                    message={`Reject this transfer request from ${request.user.email}?`}
                  >
                    Reject
                  </ConfirmSubmitButton>
                </div>
              </form>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Reviewed {request.reviewedAt?.toLocaleString() ?? "—"}.{" "}
                {request.adminNote}
              </p>
            )}
          </article>
        ))}
        {requests.length === 0 ? (
          <p className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No {status.toLowerCase()} bank-transfer requests.
          </p>
        ) : null}
      </div>
    </>
  );
}
