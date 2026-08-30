import { SubscriptionStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { hasPaidEntitlements } from "./entitlement-rules";

const now = new Date("2026-08-30T10:00:00.000Z");
describe("subscription entitlement rules", () => {
  it("allows active and trialing subscriptions", () => {
    expect(
      hasPaidEntitlements(SubscriptionStatus.ACTIVE, null, null, now),
    ).toBe(true);
    expect(
      hasPaidEntitlements(SubscriptionStatus.TRIALING, null, null, now),
    ).toBe(true);
  });
  it("honors grace and paid-through dates", () => {
    expect(
      hasPaidEntitlements(
        SubscriptionStatus.PAST_DUE,
        null,
        new Date("2026-09-02T10:00:00Z"),
        now,
      ),
    ).toBe(true);
    expect(
      hasPaidEntitlements(
        SubscriptionStatus.PAST_DUE,
        null,
        new Date("2026-08-29T10:00:00Z"),
        now,
      ),
    ).toBe(false);
    expect(
      hasPaidEntitlements(
        SubscriptionStatus.CANCELED,
        new Date("2026-09-01T00:00:00Z"),
        null,
        now,
      ),
    ).toBe(true);
  });
  it("falls back for unpaid and expired states", () => {
    expect(
      hasPaidEntitlements(SubscriptionStatus.UNPAID, null, null, now),
    ).toBe(false);
    expect(
      hasPaidEntitlements(SubscriptionStatus.EXPIRED, null, null, now),
    ).toBe(false);
  });
});
