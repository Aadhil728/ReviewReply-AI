"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/branding/brand";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const fieldClass =
  "mt-2 h-11 w-full rounded-xl border bg-background px-3 outline-none focus:ring-2 focus:ring-ring";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setPending(false);
    if (result.error) {
      toast.error(
        "Password recovery is currently unavailable. Contact the site administrator.",
      );
      return;
    }
    setSent(true);
  }
  return (
    <RecoveryShell
      title="Reset your password"
      description="Enter your account email and we’ll send a secure one-hour reset link."
    >
      {sent ? (
        <div className="rounded-xl bg-success/10 p-4 text-sm text-success">
          If that email exists, a reset link has been sent. Check your inbox and
          spam folder.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-semibold">
            Email
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <Button className="w-full" size="lg" disabled={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}Send
            reset link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </RecoveryShell>
  );
}

export function ResetPasswordForm({
  token,
  invalid,
}: {
  token?: string;
  invalid?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation)
      return toast.error("The passwords do not match.");
    setPending(true);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setPending(false);
    if (result.error)
      return toast.error("This reset link is invalid or has expired.");
    toast.success("Password updated. You can now sign in.");
    router.push("/login");
    router.refresh();
  }
  return (
    <RecoveryShell
      title="Choose a new password"
      description="Use at least eight characters and do not reuse a compromised password."
    >
      {invalid || !token ? (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          This reset link is invalid or has expired. Request a new link.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-semibold">
            New password
            <input
              required
              minLength={8}
              maxLength={128}
              type="password"
              name="password"
              autoComplete="new-password"
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Confirm password
            <input
              required
              minLength={8}
              maxLength={128}
              type="password"
              name="confirmation"
              autoComplete="new-password"
              className={fieldClass}
            />
          </label>
          <Button className="w-full" size="lg" disabled={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}Update
            password
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link
          href="/forgot-password"
          className="font-semibold text-primary hover:underline"
        >
          Request another link
        </Link>
      </p>
    </RecoveryShell>
  );
}

function RecoveryShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/35 p-5">
      <div className="w-full max-w-md">
        <Brand />
        <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  );
}
