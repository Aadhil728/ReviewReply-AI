"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BillingManageButton() {
  const [pending, setPending] = useState(false);
  async function open() {
    setPending(true);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: string };
    if (response.ok && data.url) window.location.assign(data.url);
    else {
      setPending(false);
      toast.error(data.error ?? "Billing management is unavailable.");
    }
  }
  return (
    <Button variant="secondary" disabled={pending} onClick={open}>
      Manage subscription
    </Button>
  );
}
