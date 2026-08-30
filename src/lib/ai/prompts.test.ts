import { describe, expect, it } from "vitest";
import { buildGenerationMessages } from "./prompts";
describe("review response prompt", () => {
  it("includes safety constraints and review context", () => {
    const messages = buildGenerationMessages({
      reviewText: "Slow service but kind staff",
      rating: 2,
      tone: "WARM_PROFESSIONAL",
      responseLength: "MEDIUM",
      language: "ENGLISH",
    });
    expect(messages[0].content).toContain("Do not invent refunds");
    expect(messages[1].content).toContain("2/5");
    expect(messages[1].content).toContain("Slow service");
  });
});
