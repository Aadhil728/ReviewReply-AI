import { BillingManageButton } from "@/components/dashboard/billing-manage-button";
import { BankTransferButton } from "@/components/dashboard/bank-transfer-button";
import { CheckoutButton } from "@/components/dashboard/checkout-button";
import { PreferencesForm } from "@/components/dashboard/preferences-form";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getSystemSetting } from "@/lib/settings";

export default async function SettingsPage() {
  const session = await requireSession();
  const [user, plans, bankValues, pendingBankRequest] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      include: { subscription: { include: { plan: true } } },
    }),
    db.plan.findMany({
      where: { isActive: true, monthlyPriceCents: { gt: 0 } },
      include: { providerPrices: true },
      orderBy: { sortOrder: "asc" },
    }),
    Promise.all(
      [
        "bank.enabled",
        "bank.name",
        "bank.accountName",
        "bank.accountNumber",
        "bank.iban",
        "bank.swift",
        "bank.instructions",
      ].map((key) => getSystemSetting(key)),
    ),
    db.bankTransferRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const [
    bankEnabled,
    bankName,
    bankAccountName,
    bankAccountNumber,
    bankIban,
    bankSwift,
    bankInstructions,
  ] = bankValues;
  return (
    <>
      <div>
        <p className="eyebrow">Your account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile, preferences, appearance, and subscription.
        </p>
      </div>
      <div className="mt-8 grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)] lg:items-start">
        <div className="space-y-4">
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-bold">Profile</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="mt-1 font-semibold">{user.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-1 font-semibold">{user.email}</dd>
              </div>
            </dl>
          </section>
          <section className="flex items-center justify-between rounded-2xl border bg-card p-6">
            <div>
              <h2 className="font-bold">Appearance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Switch between light and dark themes.
              </p>
            </div>
            <ThemeToggle />
          </section>
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-bold">AI preferences</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These defaults are applied when you open the generator.
            </p>
            <PreferencesForm
              defaultLength={user.defaultLength}
              defaultLanguage={user.defaultLanguage}
            />
          </section>
        </div>
        <section className="rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="font-bold">Subscription</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current plan:{" "}
            <strong className="text-foreground">
              {user.subscription?.plan.name ?? "Free"}
            </strong>
            {user.subscription ? ` · ${user.subscription.status}` : ""}
          </p>
          {user.subscription?.provider === "STRIPE" ||
          user.subscription?.provider === "PAYPAL" ? (
            <div className="mt-4">
              <BillingManageButton />
            </div>
          ) : user.subscription?.provider === "BANK_TRANSFER" ? (
            <p className="mt-4 rounded-xl bg-success/10 p-4 text-sm text-success">
              Your manually approved subscription is active until{" "}
              {user.subscription.currentPeriodEnd?.toLocaleDateString() ??
                "the recorded period end"}
              .
            </p>
          ) : (
            <div className="mt-5 grid gap-3">
              {pendingBankRequest ? (
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
                  <p className="font-bold text-warning">
                    Bank transfer awaiting review
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Your {pendingBankRequest.plan.name} request was submitted on{" "}
                    {pendingBankRequest.createdAt.toLocaleDateString()}.
                  </p>
                </div>
              ) : null}
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.generationLimit} generations/month
                      </p>
                    </div>
                    <span className="font-bold">
                      ${(plan.monthlyPriceCents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {plan.providerPrices.some(
                      (price) =>
                        price.provider === "STRIPE" &&
                        price.isActive &&
                        price.externalPriceId,
                    ) && (
                      <CheckoutButton planId={plan.id} provider="STRIPE">
                        Stripe
                      </CheckoutButton>
                    )}
                    {plan.providerPrices.some(
                      (price) =>
                        price.provider === "PAYPAL" &&
                        price.isActive &&
                        price.externalPriceId,
                    ) && (
                      <CheckoutButton planId={plan.id} provider="PAYPAL">
                        PayPal
                      </CheckoutButton>
                    )}
                    {bankEnabled === "true" && !pendingBankRequest ? (
                      <BankTransferButton planId={plan.id} />
                    ) : null}
                  </div>
                  {bankEnabled === "true" ? (
                    <div className="mt-4 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">
                          {bankName || "Bank transfer"}
                        </strong>
                      </p>
                      {bankAccountName ? (
                        <p>Account name: {bankAccountName}</p>
                      ) : null}
                      {bankAccountNumber ? (
                        <p>Account: {bankAccountNumber}</p>
                      ) : null}
                      {bankIban ? <p>IBAN: {bankIban}</p> : null}
                      {bankSwift ? <p>SWIFT/BIC: {bankSwift}</p> : null}
                      {bankInstructions ? (
                        <p className="mt-1">{bankInstructions}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
