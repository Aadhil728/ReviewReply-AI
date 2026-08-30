"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BankTransferButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/billing/bank-transfer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...values, planId }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok)
      return toast.error(data.error ?? "The request could not be submitted.");
    toast.success("Bank-transfer request submitted for review.");
    setOpen(false);
    router.refresh();
  }

  if (!open)
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Landmark className="size-4" /> Bank transfer
      </Button>
    );
  return (
    <form
      onSubmit={submit}
      className="mt-4 space-y-3 rounded-xl border bg-background p-4"
    >
      <p className="text-xs text-muted-foreground">
        Transfer the displayed amount, then enter your bank reference. Access
        activates only after administrator approval.
      </p>
      <input
        name="transferReference"
        maxLength={120}
        placeholder="Transfer reference (optional)"
        className="h-10 w-full rounded-xl border bg-card px-3 text-sm"
      />
      <textarea
        name="customerNote"
        maxLength={500}
        rows={2}
        placeholder="Note to administrator (optional)"
        className="w-full rounded-xl border bg-card p-3 text-sm"
      />
      <div className="flex gap-2">
        <Button disabled={pending}>
          {pending ? "Submitting…" : "I have transferred"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
