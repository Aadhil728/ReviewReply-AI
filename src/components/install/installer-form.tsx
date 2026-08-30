"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring";

export function InstallerForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    adminEmail?: string;
  }>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(undefined);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/install", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        adminEmail?: string;
      };
      setResult({
        ok: response.ok,
        message: response.ok
          ? "Installation complete. Sign in with the administrator account."
          : (data.error ?? "Installation failed."),
        adminEmail: data.adminEmail,
      });
    } catch {
      setResult({
        ok: false,
        message: "The installer could not reach the server.",
      });
    } finally {
      setPending(false);
    }
  }
  if (result?.ok) {
    return (
      <section className="mt-8 rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <p className="eyebrow mt-6">Installation complete</p>
        <h2 className="mt-2 text-2xl font-bold">
          Your admin workspace is ready.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Sign in with{" "}
          <strong className="text-foreground">{result.adminEmail}</strong> to
          configure plans, payments, branding, and users.
        </p>
        <Button
          size="lg"
          className="mt-7"
          onClick={async () => {
            await authClient.signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          Sign in as administrator
          <ArrowRight className="size-4" />
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          The installer is now locked for security.
        </p>
      </section>
    );
  }
  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-bold">1. Installation access</h2>
        <label className="mt-4 block text-sm font-semibold">
          Installation token
          <input
            required
            name="installationToken"
            type="password"
            className={inputClass}
          />
        </label>
      </section>
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-bold">2. Initial administrator</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Name
            <input required name="name" className={inputClass} />
          </label>
          <label className="text-sm font-semibold">
            Email
            <input required name="email" type="email" className={inputClass} />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Password
            <input
              required
              name="password"
              type="password"
              minLength={8}
              className={inputClass}
            />
          </label>
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-bold">3. Product identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Product name
            <input
              required
              name="productName"
              defaultValue="ReviewReply AI"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold">
            Company name
            <input
              required
              name="companyName"
              defaultValue="Aara Creations"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Contact email
            <input
              required
              name="contactEmail"
              type="email"
              className={inputClass}
            />
          </label>
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-bold">4. AI provider</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">
            API key
            <input
              required
              name="aiApiKey"
              type="password"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold">
            Base URL
            <input
              required
              name="aiBaseUrl"
              type="url"
              defaultValue="https://api.openai.com/v1"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold">
            Model
            <input
              required
              name="aiModel"
              defaultValue="gpt-5-mini"
              className={inputClass}
            />
          </label>
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-bold">5. Email delivery (optional)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure SMTP now to enable password-reset emails. You can also do
          this later in Admin.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            SMTP host
            <input
              name="smtpHost"
              placeholder="smtp.example.com"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold">
            Port
            <input
              name="smtpPort"
              type="number"
              defaultValue="587"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold">
            Username
            <input name="smtpUser" autoComplete="off" className={inputClass} />
          </label>
          <label className="text-sm font-semibold">
            Password
            <input
              name="smtpPassword"
              type="password"
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            From email
            <input
              name="smtpFromEmail"
              type="email"
              placeholder="support@example.com"
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input name="smtpSecure" type="checkbox" /> Use implicit TLS
            (usually port 465)
          </label>
        </div>
      </section>
      {result && (
        <p
          role="status"
          className={
            result.ok
              ? "rounded-xl bg-success/10 p-4 text-sm text-success"
              : "rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
          }
        >
          {result.message}
        </p>
      )}
      <Button size="lg" disabled={pending} type="submit">
        {pending && <LoaderCircle className="size-4 animate-spin" />}Complete
        installation
      </Button>
    </form>
  );
}
