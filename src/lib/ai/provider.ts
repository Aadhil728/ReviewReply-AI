import "server-only";
import { getAIConfiguration } from "@/lib/settings";

export type AIMessage = { role: "system" | "user"; content: string };
export interface AIProvider {
  generate(messages: AIMessage[]): Promise<{
    text: string;
    provider: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    tokensUsed?: number;
  }>;
}

export class AIProviderError extends Error {
  constructor(
    public readonly code: "AUTH" | "QUOTA" | "REQUEST" | "UNAVAILABLE",
  ) {
    super(`AI_PROVIDER_${code}`);
  }
}

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};
type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function providerError(status: number) {
  if (status === 401 || status === 403) return new AIProviderError("AUTH");
  if (status === 429) return new AIProviderError("QUOTA");
  if (status >= 400 && status < 500) return new AIProviderError("REQUEST");
  return new AIProviderError("UNAVAILABLE");
}

function extractResponseText(data: OpenAIResponse) {
  if (data.output_text?.trim()) return data.output_text.trim();
  return data.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text ?? "")
    .join("")
    .trim();
}

class OpenAICompatibleProvider implements AIProvider {
  async generate(messages: AIMessage[]) {
    const environment = await getAIConfiguration();
    const base = environment.AI_BASE_URL.replace(/\/$/, "");
    return new URL(base).hostname === "api.openai.com"
      ? this.generateWithResponsesAPI(base, environment, messages)
      : this.generateWithChatCompletions(base, environment, messages);
  }

  private async generateWithResponsesAPI(
    base: string,
    environment: Awaited<ReturnType<typeof getAIConfiguration>>,
    messages: AIMessage[],
  ) {
    const instructions = messages.find(
      (message) => message.role === "system",
    )?.content;
    const input =
      messages.find((message) => message.role === "user")?.content ?? "";
    const response = await fetch(`${base}/responses`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${environment.AI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: environment.AI_MODEL,
        instructions,
        input,
        store: false,
      }),
    });
    if (!response.ok) throw providerError(response.status);
    const data = (await response.json()) as OpenAIResponse;
    const text = extractResponseText(data);
    if (!text) throw new AIProviderError("UNAVAILABLE");
    return {
      text,
      provider: "openai",
      model: environment.AI_MODEL,
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  private async generateWithChatCompletions(
    base: string,
    environment: Awaited<ReturnType<typeof getAIConfiguration>>,
    messages: AIMessage[],
  ) {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${environment.AI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: environment.AI_MODEL, messages }),
    });
    if (!response.ok) throw providerError(response.status);
    const data = (await response.json()) as ChatCompletionResponse;
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new AIProviderError("UNAVAILABLE");
    return {
      text,
      provider: new URL(base).hostname,
      model: environment.AI_MODEL,
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
      tokensUsed: data.usage?.total_tokens,
    };
  }
}

export const aiProvider: AIProvider = new OpenAICompatibleProvider();
