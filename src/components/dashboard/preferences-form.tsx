"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PreferencesForm({
  defaultLength,
  defaultLanguage,
}: {
  defaultLength: string;
  defaultLanguage: string;
}) {
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    if (response.ok) toast.success("Preferences saved");
    else toast.error("Preferences could not be saved.");
  }
  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">
        Default response length
        <select
          name="defaultLength"
          defaultValue={defaultLength}
          className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal"
        >
          <option value="SHORT">Short</option>
          <option value="MEDIUM">Medium</option>
          <option value="DETAILED">Detailed</option>
        </select>
      </label>
      <label className="text-sm font-semibold">
        Default language
        <select
          name="defaultLanguage"
          defaultValue={defaultLanguage}
          className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal"
        >
          <option value="AUTO">Auto detect</option>
          <option value="ENGLISH">English</option>
          <option value="ARABIC">Arabic</option>
          <option value="SPANISH">Spanish</option>
          <option value="FRENCH">French</option>
          <option value="GERMAN">German</option>
        </select>
      </label>
      <Button
        disabled={pending}
        className="sm:col-span-2 sm:w-fit"
        type="submit"
      >
        Save preferences
      </Button>
    </form>
  );
}
