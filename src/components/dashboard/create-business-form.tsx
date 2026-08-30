"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CreateBusinessForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/business", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        preferredTone: "WARM_PROFESSIONAL",
        defaultLanguage: "AUTO",
      }),
    });
    const data = (await response.json()) as {
      business?: { id: string };
      error?: string;
    };
    setPending(false);
    if (!response.ok || !data.business) {
      toast.error(data.error ?? "The business could not be created.");
      return;
    }
    toast.success("Business created");
    setOpen(false);
    router.push(`/dashboard/business?business=${data.business.id}`);
    router.refresh();
  }

  if (!open)
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add business
      </Button>
    );

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]"
    >
      <input
        name="name"
        required
        minLength={2}
        maxLength={100}
        placeholder="Business name"
        className="h-11 rounded-xl border bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        name="industry"
        required
        minLength={2}
        maxLength={80}
        placeholder="Industry"
        className="h-11 rounded-xl border bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex gap-2">
        <Button disabled={pending}>{pending ? "Adding…" : "Add"}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
