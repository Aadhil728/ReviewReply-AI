"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CheckoutButton({
  planId,
  provider,
  children,
}: {
  planId: string;
  provider: "STRIPE" | "PAYPAL";
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  async function checkout() {
    setPending(true);
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId, provider }),
    });
    const data = (await response.json()) as { url?: string; error?: string };
    if (response.ok && data.url) window.location.assign(data.url);
    else {
      setPending(false);
      toast.error(data.error ?? "Checkout is unavailable.");
    }
  }
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={checkout}
    >
      {children}
    </Button>
  );
}
