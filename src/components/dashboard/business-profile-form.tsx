"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
type Business = {
  id: string;
  name: string;
  industry: string;
  description: string;
  preferredTone: string;
  defaultLanguage: string;
  signOff: string;
  phrasesToUse: string;
  phrasesToAvoid: string;
};
export function BusinessProfileForm({
  business,
  showHeading = true,
}: {
  business: Business;
  showHeading?: boolean;
}) {
  const [pending, setPending] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const response = await fetch("/api/business/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    setPending(false);
    if (response.ok) toast.success("Business profile saved");
    else toast.error("We couldn't save your changes.");
  }
  return (
    <>
      {showHeading ? (
        <div>
          <p className="eyebrow">Brand voice</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Business profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Give the generator just enough context to sound like your business.
          </p>
        </div>
      ) : null}
      <form
        onSubmit={submit}
        className="mt-8 w-full space-y-6 rounded-2xl border bg-card p-6 sm:p-8"
      >
        <input type="hidden" name="id" value={business.id} />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Business name"
            name="name"
            defaultValue={business.name}
          />
          <Field
            label="Industry"
            name="industry"
            defaultValue={business.industry}
          />
        </div>
        <Area
          label="Business description"
          name="description"
          defaultValue={business.description}
          placeholder="We are a modern family-owned restaurant. Replies should feel warm and personal."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Preferred tone"
            name="preferredTone"
            defaultValue={business.preferredTone}
          />
          <Field
            label="Default language"
            name="defaultLanguage"
            defaultValue={business.defaultLanguage}
          />
          <Field
            label="Common sign-off"
            name="signOff"
            defaultValue={business.signOff}
          />
          <Field
            label="Words or phrases to use"
            name="phrasesToUse"
            defaultValue={business.phrasesToUse}
          />
        </div>
        <Area
          label="Words or phrases to avoid"
          name="phrasesToAvoid"
          defaultValue={business.phrasesToAvoid}
        />
        <Button disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </>
  );
}
function Field({
  label,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        {...p}
        className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
function Area({
  label,
  ...p
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        {...p}
        rows={3}
        className="mt-2 w-full rounded-xl border bg-background p-3 font-normal leading-6 outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
