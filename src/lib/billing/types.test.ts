import { SubscriptionStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { normalizePayPalStatus, normalizeStripeStatus } from "./types";

describe("payment status normalization", () => {
  it("normalizes Stripe states", () => {
    expect(normalizeStripeStatus("active")).toBe(SubscriptionStatus.ACTIVE);
    expect(normalizeStripeStatus("past_due")).toBe(SubscriptionStatus.PAST_DUE);
    expect(normalizeStripeStatus("incomplete_expired")).toBe(
      SubscriptionStatus.EXPIRED,
    );
  });
  it("normalizes PayPal states", () => {
    expect(normalizePayPalStatus("ACTIVE")).toBe(SubscriptionStatus.ACTIVE);
    expect(normalizePayPalStatus("SUSPENDED")).toBe(
      SubscriptionStatus.PAST_DUE,
    );
    expect(normalizePayPalStatus("CANCELLED")).toBe(
      SubscriptionStatus.CANCELED,
    );
  });
});
