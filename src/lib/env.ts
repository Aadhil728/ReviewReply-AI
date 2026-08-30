import "server-only";
import { z } from "zod";

const bootstrapEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  APP_ENCRYPTION_KEY: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.url(),
  INSTALLATION_TOKEN: z.string().min(16),
});

const aiEnvironmentSchema = z.object({
  AI_API_KEY: z.string().min(1),
  AI_BASE_URL: z.url(),
  AI_MODEL: z.string().min(1),
});

export function getBootstrapEnvironment() {
  const parsed = bootstrapEnvironmentSchema.safeParse(process.env);
  if (!parsed.success) throw new Error("ENVIRONMENT_NOT_CONFIGURED");
  return parsed.data;
}

export function getEnvironmentStatus() {
  const result = bootstrapEnvironmentSchema.safeParse(process.env);
  return {
    valid: result.success,
    missing: result.success
      ? []
      : result.error.issues
          .map((issue) => String(issue.path[0]))
          .filter((key, index, all) => all.indexOf(key) === index),
  };
}

export function getAIEnvironment() {
  const parsed = aiEnvironmentSchema.safeParse({
    AI_API_KEY: process.env.AI_API_KEY,
    AI_BASE_URL: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
    AI_MODEL: process.env.AI_MODEL ?? "gpt-5-mini",
  });
  if (!parsed.success) throw new Error("AI_NOT_CONFIGURED");
  return parsed.data;
}
