import { Check } from "lucide-react";
import { BankTransferButton } from "@/components/dashboard/bank-transfer-button";
import { BillingManageButton } from "@/components/dashboard/billing-manage-button";
import { CheckoutButton } from "@/components/dashboard/checkout-button";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getSystemSetting } from "@/lib/settings";

export default async function UpgradePage() {
  const session = await requireSession();
  const [user, plans, bankValues, pendingRequest] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.user.id }, include: { subscription: { include: { plan: true } } } }),
    db.plan.findMany({ where: { isActive: true }, include: { providerPrices: true }, orderBy: { sortOrder: "asc" } }),
    Promise.all(["bank.enabled", "bank.name", "bank.accountName", "bank.accountNumber", "bank.iban", "bank.swift", "bank.instructions"].map((key) => getSystemSetting(key))),
    db.bankTransferRequest.findFirst({ where: { userId: session.user.id, status: "PENDING" }, include: { plan: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const [bankEnabled, bankName, accountName, accountNumber, iban, swift, instructions] = bankValues;
  const currentPlan = user.subscription?.status === "ACTIVE" || user.subscription?.status === "TRIALING" ? user.subscription.plan : plans.find((plan) => plan.code === "FREE");
  const canManage = user.subscription?.provider === "STRIPE" || user.subscription?.provider === "PAYPAL";
  return <>
    <div><p className="eyebrow">Plans and billing</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Choose the plan that fits.</h1><p className="mt-2 text-muted-foreground">Upgrade securely by card, PayPal, or administrator-verified bank transfer.</p></div>
    {pendingRequest ? <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/5 p-5"><p className="font-bold text-warning">Payment verification pending</p><p className="mt-1 text-sm text-muted-foreground">Your {pendingRequest.plan.name} bank-transfer request is waiting for administrator review. Your current plan remains active until approval.</p></div> : null}
    <div className="mt-8 grid gap-5 lg:grid-cols-3">{plans.map((plan) => {
      const isCurrent = currentPlan?.id === plan.id;
      const stripe = plan.providerPrices.some((price) => price.provider === "STRIPE" && price.isActive && price.externalPriceId);
      const paypal = plan.providerPrices.some((price) => price.provider === "PAYPAL" && price.isActive && price.externalPriceId);
      return <article key={plan.id} className={`rounded-2xl border bg-card p-6 ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}>
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{plan.name}</h2><p className="mt-1 text-sm text-muted-foreground">Monthly subscription</p></div>{isCurrent ? <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">Current</span> : null}</div>
        <p className="mt-6 text-3xl font-bold">{plan.monthlyPriceCents ? `$${(plan.monthlyPriceCents / 100).toFixed(2)}` : "Free"}<span className="text-sm font-normal text-muted-foreground">{plan.monthlyPriceCents ? "/month" : ""}</span></p>
        <ul className="mt-6 space-y-3 text-sm"><li className="flex gap-2"><Check className="size-4 text-success" />{plan.generationLimit.toLocaleString()} AI generations per month</li><li className="flex gap-2"><Check className="size-4 text-success" />{plan.businessLimit} business {plan.businessLimit === 1 ? "profile" : "profiles"}</li><li className="flex gap-2"><Check className="size-4 text-success" />Editable replies and response history</li></ul>
        <div className="mt-7 flex flex-wrap gap-2">{isCurrent && canManage ? <BillingManageButton /> : null}{!isCurrent && plan.monthlyPriceCents > 0 && stripe ? <CheckoutButton planId={plan.id} provider="STRIPE">Subscribe with Stripe</CheckoutButton> : null}{!isCurrent && plan.monthlyPriceCents > 0 && paypal ? <CheckoutButton planId={plan.id} provider="PAYPAL">Subscribe with PayPal</CheckoutButton> : null}{!isCurrent && plan.monthlyPriceCents > 0 && bankEnabled === "true" && !pendingRequest ? <BankTransferButton planId={plan.id} /> : null}</div>
        {!isCurrent && plan.monthlyPriceCents > 0 && !stripe && !paypal && bankEnabled !== "true" ? <p className="mt-5 text-sm text-muted-foreground">No payment method is configured for this plan yet.</p> : null}
      </article>;
    })}</div>
    {bankEnabled === "true" ? <section className="mt-6 max-w-3xl rounded-2xl border bg-card p-6"><h2 className="font-bold">Bank-transfer instructions</h2><div className="mt-4 grid gap-2 text-sm"><p><span className="text-muted-foreground">Bank:</span> {bankName || "Not provided"}</p><p><span className="text-muted-foreground">Account name:</span> {accountName || "Not provided"}</p><p><span className="text-muted-foreground">Account number:</span> {accountNumber || "Not provided"}</p>{iban ? <p><span className="text-muted-foreground">IBAN:</span> {iban}</p> : null}{swift ? <p><span className="text-muted-foreground">SWIFT/BIC:</span> {swift}</p> : null}{instructions ? <p className="mt-2 text-muted-foreground">{instructions}</p> : null}</div></section> : null}
  </>;
}
