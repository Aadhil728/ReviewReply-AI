import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { recordAdminAction } from "@/lib/admin-audit";
import { aiProvider } from "@/lib/ai/provider";
import { testEmailConnection } from "@/lib/email";
import { getSafeSystemSettings, setSystemSetting } from "@/lib/settings";
import { requireAdmin } from "@/lib/session";

const fields = [
  ["branding.productName", "branding", "Product name", "ReviewReply AI", false],
  ["branding.companyName", "branding", "Company name", "Aara Creations", false],
  [
    "branding.contactEmail",
    "branding",
    "Contact email",
    "support@example.com",
    false,
  ],
  ["branding.privacyUrl", "branding", "Privacy URL", "/privacy", false],
  ["branding.termsUrl", "branding", "Terms URL", "/terms", false],
  ["ai.baseUrl", "ai", "AI base URL", "https://api.openai.com/v1", false],
  ["ai.model", "ai", "AI model", "gpt-5-mini", false],
  ["ai.apiKey", "ai", "AI API key", "Leave blank to keep the saved key", true],
  [
    "ai.inputCostPerMillion",
    "ai",
    "Input cost per 1M tokens (USD)",
    "0",
    false,
  ],
  [
    "ai.outputCostPerMillion",
    "ai",
    "Output cost per 1M tokens (USD)",
    "0",
    false,
  ],
  [
    "stripe.secretKey",
    "billing",
    "Stripe secret key",
    "Leave blank to keep the saved key",
    true,
  ],
  [
    "stripe.webhookSecret",
    "billing",
    "Stripe webhook secret",
    "Leave blank to keep the saved secret",
    true,
  ],
  [
    "paypal.clientId",
    "billing",
    "PayPal client ID",
    "PayPal Sandbox client ID",
    false,
  ],
  [
    "paypal.clientSecret",
    "billing",
    "PayPal client secret",
    "Leave blank to keep the saved secret",
    true,
  ],
  [
    "paypal.webhookId",
    "billing",
    "PayPal webhook ID",
    "Leave blank to keep the saved ID",
    true,
  ],
  [
    "paypal.baseUrl",
    "billing",
    "PayPal API base URL",
    "https://api-m.sandbox.paypal.com",
    false,
  ],
  ["bank.enabled", "bank", "Enable bank transfer", "true or false", false],
  ["bank.name", "bank", "Bank name", "Example National Bank", false],
  ["bank.accountName", "bank", "Account name", "Your Company Ltd", false],
  ["bank.accountNumber", "bank", "Account number", "Account number", false],
  ["bank.iban", "bank", "IBAN", "Optional IBAN", false],
  ["bank.swift", "bank", "SWIFT / BIC", "Optional SWIFT code", false],
  [
    "bank.instructions",
    "bank",
    "Payment instructions",
    "Include the account email as the transfer reference.",
    false,
  ],
  ["email.smtpHost", "email", "SMTP host", "smtp.example.com", false],
  ["email.smtpPort", "email", "SMTP port", "587", false],
  ["email.smtpSecure", "email", "Use secure TLS", "false", false],
  ["email.smtpUser", "email", "SMTP username", "smtp-user", false],
  [
    "email.smtpPassword",
    "email",
    "SMTP password",
    "Leave blank to keep the saved password",
    true,
  ],
  ["email.fromName", "email", "Sender name", "ReviewReply AI", false],
  ["email.fromAddress", "email", "Sender email", "noreply@example.com", false],
] as const;

async function saveConfiguration(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  for (const [key, group, , , secret] of fields) {
    const value = z
      .string()
      .trim()
      .max(500)
      .parse(formData.get(key) ?? "");
    if (secret && !value) continue;
    await setSystemSetting(key, group, value);
  }
  await recordAdminAction({
    actorId: session.user.id,
    action: "SYSTEM_CONFIGURATION_UPDATED",
    targetType: "SystemSetting",
    metadata: { keys: fields.map(([key]) => key) },
  });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?notice=Configuration saved successfully.");
}

async function testAI() {
  "use server";
  const session = await requireAdmin();
  try {
    await aiProvider.generate([
      { role: "system", content: "Return only the word OK." },
      { role: "user", content: "Connection test" },
    ]);
    await recordAdminAction({
      actorId: session.user.id,
      action: "AI_CONNECTION_TESTED",
      targetType: "AIProvider",
      metadata: { result: "success" },
    });
  } catch {
    await recordAdminAction({
      actorId: session.user.id,
      action: "AI_CONNECTION_TESTED",
      targetType: "AIProvider",
      metadata: { result: "failed" },
    });
    redirect(
      "/admin/settings?error=AI connection failed. Check the provider key, URL, model, and quota.",
    );
  }
  redirect("/admin/settings?notice=AI connection succeeded.");
}

async function testEmail() {
  "use server";
  const session = await requireAdmin();
  try {
    await testEmailConnection(session.user.email);
    await recordAdminAction({
      actorId: session.user.id,
      action: "EMAIL_CONNECTION_TESTED",
      targetType: "EmailProvider",
      metadata: { result: "success" },
    });
  } catch {
    await recordAdminAction({
      actorId: session.user.id,
      action: "EMAIL_CONNECTION_TESTED",
      targetType: "EmailProvider",
      metadata: { result: "failed" },
    });
    redirect(
      "/admin/settings?error=Email test failed. Check the SMTP host, port, security, credentials, and sender address.",
    );
  }
  redirect(
    "/admin/settings?notice=Test email sent to the administrator address.",
  );
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const saved = await getSafeSystemSettings();
  const byKey = new Map(saved.map((setting) => [setting.key, setting]));
  const groups = [
    {
      id: "branding",
      title: "Branding and company",
      description:
        "Customize the product identity, support contact, and legal destinations.",
      fields: fields.filter(([key]) => key.startsWith("branding.")),
    },
    {
      id: "ai",
      title: "AI provider",
      description:
        "Configure the OpenAI-compatible provider used for generations and cost estimates.",
      fields: fields.filter(([key]) => key.startsWith("ai.")),
    },
    {
      id: "stripe",
      title: "Stripe",
      description:
        "Add test-mode credentials first. Webhooks remain the source of truth for access.",
      fields: fields.filter(([key]) => key.startsWith("stripe.")),
    },
    {
      id: "paypal",
      title: "PayPal",
      description:
        "Use PayPal Sandbox credentials until the full subscription flow is verified.",
      fields: fields.filter(([key]) => key.startsWith("paypal.")),
    },
    {
      id: "email",
      title: "Transactional email",
      description:
        "Configure SMTP for password recovery and operational messages. Use false for STARTTLS on port 587 and true for implicit TLS on port 465.",
      fields: fields.filter(([key]) => key.startsWith("email.")),
    },
    {
      id: "bank",
      title: "Manual bank transfer",
      description:
        "Offer a credential-free payment option. Requests remain pending until an administrator verifies the transfer.",
      fields: fields.filter(([key]) => key.startsWith("bank.")),
    },
  ];
  return (
    <>
      <div>
        <p className="eyebrow">White-label and providers</p>
        <h1 className="mt-2 text-3xl font-bold">Configuration</h1>
        <p className="mt-2 text-muted-foreground">
          Secret values are encrypted at rest and never returned to this page.
        </p>
      </div>
      <AdminNotice notice={params.notice} error={params.error} />
      <form action={saveConfiguration} className="mt-8 max-w-5xl space-y-5">
        {groups.map((group) => (
          <section
            key={group.id}
            className="rounded-2xl border bg-card p-5 sm:p-6"
          >
            <div className="border-b pb-4">
              <h2 className="font-bold">{group.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.description}
              </p>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {group.fields.map(([key, , label, placeholder, secret]) => {
                const setting = byKey.get(key);
                if (key === "bank.enabled") {
                  const enabled = setting?.value === "true";
                  return (
                    <fieldset key={key} className="sm:col-span-2">
                      <legend className="text-sm font-semibold">{label}</legend>
                      <div className="mt-2 inline-grid grid-cols-2 rounded-xl border bg-background p-1">
                        <label className="cursor-pointer rounded-lg px-5 py-2 text-center text-sm font-semibold text-muted-foreground transition has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:shadow-sm">
                          <input
                            className="sr-only"
                            type="radio"
                            name={key}
                            value="true"
                            defaultChecked={enabled}
                          />
                          Enabled
                        </label>
                        <label className="cursor-pointer rounded-lg px-5 py-2 text-center text-sm font-semibold text-muted-foreground transition has-[:checked]:bg-muted has-[:checked]:text-foreground">
                          <input
                            className="sr-only"
                            type="radio"
                            name={key}
                            value="false"
                            defaultChecked={!enabled}
                          />
                          Disabled
                        </label>
                      </div>
                      <p className="mt-2 text-xs font-normal text-muted-foreground">
                        When enabled, customers can submit transfers for manual administrator approval.
                      </p>
                    </fieldset>
                  );
                }
                return (
                  <label key={key} className="text-sm font-semibold">
                    {label}
                    {secret && setting?.configured && (
                      <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                        Configured
                      </span>
                    )}
                    <input
                      name={key}
                      type={secret ? "password" : "text"}
                      defaultValue={secret ? "" : (setting?.value ?? "")}
                      placeholder={placeholder}
                      autoComplete="off"
                      className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        <div className="sticky bottom-4 flex items-center justify-end rounded-2xl border bg-card/95 p-4 shadow-lg backdrop-blur">
          <Button type="submit">Save all configuration</Button>
        </div>
      </form>
      <form
        action={testAI}
        className="mt-4 max-w-5xl rounded-2xl border bg-card p-5 sm:p-6"
      >
        <h2 className="font-bold">Connection test</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Save the AI section first, then verify the provider can answer a
          minimal request.
        </p>
        <Button variant="secondary" type="submit">
          Test AI connection
        </Button>
      </form>
      <form
        action={testEmail}
        className="mt-4 max-w-5xl rounded-2xl border bg-card p-5 sm:p-6"
      >
        <h2 className="font-bold">Email test</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Save the transactional email section first. The test is sent to your
          administrator email address.
        </p>
        <Button className="mt-4" variant="secondary" type="submit">
          Send test email
        </Button>
      </form>
    </>
  );
}
