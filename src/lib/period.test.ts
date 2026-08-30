import { describe, expect, it } from "vitest";
import { getNextUtcReset, getUtcPeriod } from "./period";

describe("UTC usage periods", () => {
  it("uses the UTC calendar month at a timezone boundary", () => {
    const date = new Date("2026-08-31T23:30:00-02:00");
    expect(getUtcPeriod(date)).toBe("2026-09");
    expect(getNextUtcReset(date).toISOString()).toBe(
      "2026-10-01T00:00:00.000Z",
    );
  });
});
