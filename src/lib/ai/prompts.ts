type PromptInput = {
  reviewText: string;
  rating: number;
  tone: string;
  responseLength: string;
  language: string;
  business?: {
    name: string;
    industry: string;
    description: string;
    signOff: string;
    phrasesToUse: string;
    phrasesToAvoid: string;
  };
};
export function buildGenerationMessages(input: PromptInput) {
  const length =
    { SHORT: "50-80 words", MEDIUM: "80-130 words", DETAILED: "130-190 words" }[
      input.responseLength
    ] ?? "80-130 words";
  return [
    {
      role: "system" as const,
      content: `You write public customer-review responses on behalf of a business. Sound natural, specific, and human. Never mention AI. Do not invent refunds, compensation, investigations, firings, or facts. Do not make legal admissions or request sensitive information publicly. Do not argue or over-apologize. Acknowledge specific positive and negative details. For complaints: acknowledge, empathize, respond, and invite offline resolution only when appropriate. Return only the reply with no quotation marks.`,
    },
    {
      role: "user" as const,
      content: `Business: ${input.business?.name ?? "the business"}\nIndustry: ${input.business?.industry ?? "local business"}\nBusiness description: ${input.business?.description || "Not provided"}\nPreferred wording: ${input.business?.phrasesToUse || "None"}\nAvoid wording: ${input.business?.phrasesToAvoid || "None"}\nSign-off: ${input.business?.signOff || "None"}\nRating: ${input.rating}/5\nTone: ${input.tone.replaceAll("_", " ")}\nLength: ${length}\nResponse language: ${input.language.replaceAll("_", " ")} (AUTO means use the review language)\nCustomer review: ${input.reviewText}`,
    },
  ];
}
export function buildRewriteMessages(text: string, action: string) {
  return [
    {
      role: "system" as const,
      content:
        "Rewrite a business's public review response. Preserve its facts and intent. Do not invent offers, compensation, or actions. Return only the revised response.",
    },
    {
      role: "user" as const,
      content: `Instruction: ${action.replaceAll("_", " ")}\nExisting response: ${text}`,
    },
  ];
}
