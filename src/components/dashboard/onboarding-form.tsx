"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Brand } from "@/components/branding/brand";
import { Button } from "@/components/ui/button";
export function OnboardingForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const response = await fetch("/api/business", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    setPending(false);
    if (!response.ok) {
      toast.error("We couldn't save your business profile.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }
  return (
    <main className="min-h-screen bg-muted/40 p-5">
      <div className="mx-auto max-w-xl py-10">
        <Brand />
        <div className="mt-12 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <p className="eyebrow">One quick step</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Tell us about your business.
          </h1>
          <p className="mt-3 text-muted-foreground">
            We’ll use this to make every reply sound more like you.
          </p>
          <form onSubmit={submit} className="mt-8 grid gap-5">
            <Field label="Business name" name="name" placeholder="Aara Cafe" />
            <Field label="Industry" name="industry" placeholder="Restaurant" />
            <Select
              label="Preferred response tone"
              name="preferredTone"
              options={[
                ["WARM_PROFESSIONAL", "Warm & Professional"],
                ["PROFESSIONAL", "Professional"],
                ["FRIENDLY", "Friendly"],
                ["LUXURY", "Luxury"],
              ]}
            />
            <Select
              label="Default language"
              name="defaultLanguage"
              options={[
                ["AUTO", "Auto detect"],
                ["ENGLISH", "English"],
                ["ARABIC", "Arabic"],
                ["TAMIL", "Tamil"],
                ["SINHALA", "Sinhala"],
              ]}
            />
            <Button size="lg" disabled={pending}>
              {pending ? "Saving…" : "Start generating"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
function Field({
  label,
  ...p
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        {...p}
        required
        className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[][];
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select
        name={name}
        className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map(([v, l]) => (
          <option value={v} key={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
