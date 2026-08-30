"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const result =
      mode === "register"
        ? await authClient.signUp.email({
            email,
            password,
            name: String(form.get("name")),
          })
        : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      toast.error(result.error.message ?? "We couldn't complete that request.");
      return;
    }
    router.push(mode === "register" ? "/onboarding" : "/dashboard");
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      {mode === "register" && (
        <Field
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
        />
      )}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@business.com"
      />
      {mode === "login" && (
        <div className="-mt-2 text-right">
          <Link
            className="text-sm font-semibold text-primary hover:underline"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
      )}
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        placeholder="At least 8 characters"
      />
      <Button className="w-full" size="lg" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        {mode === "login" ? "Sign in" : "Create free account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login"
          ? "New to ReviewReply AI? "
          : "Already have an account? "}
        <Link
          className="font-semibold text-primary hover:underline"
          href={mode === "login" ? "/register" : "/login"}
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        required
        className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none transition focus:ring-2 focus:ring-ring"
        {...props}
      />
    </label>
  );
}
