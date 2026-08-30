import "server-only";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/encryption";

const SECRET_KEYS = new Set([
  "ai.apiKey",
  "stripe.secretKey",
  "stripe.webhookSecret",
  "paypal.clientSecret",
  "paypal.webhookId",
  "email.smtpPassword",
]);

export async function setSystemSetting(
  key: string,
  group: string,
  value: string,
) {
  const encrypted = SECRET_KEYS.has(key);
  return db.systemSetting.upsert({
    where: { key },
    create: {
      key,
      group,
      encrypted,
      value: encrypted && value ? encryptSecret(value) : value,
    },
    update: {
      group,
      encrypted,
      value: encrypted && value ? encryptSecret(value) : value,
    },
  });
}

export async function getSystemSetting(key: string) {
  const setting = await db.systemSetting.findUnique({ where: { key } });
  if (!setting) return null;
  return setting.encrypted ? decryptSecret(setting.value) : setting.value;
}

export async function getSafeSystemSettings() {
  const settings = await db.systemSetting.findMany({
    orderBy: [{ group: "asc" }, { key: "asc" }],
  });
  return settings.map((setting) => ({
    key: setting.key,
    group: setting.group,
    configured: Boolean(setting.value),
    value: setting.encrypted ? "" : setting.value,
    secret: setting.encrypted,
  }));
}

export async function getAIConfiguration() {
  const [storedKey, storedBaseUrl, storedModel] = await Promise.all([
    getSystemSetting("ai.apiKey"),
    getSystemSetting("ai.baseUrl"),
    getSystemSetting("ai.model"),
  ]);
  const apiKey = storedKey || process.env.AI_API_KEY;
  const baseUrl =
    storedBaseUrl || process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = storedModel || process.env.AI_MODEL || "gpt-5-mini";
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");
  return { AI_API_KEY: apiKey, AI_BASE_URL: baseUrl, AI_MODEL: model };
}

export async function getEmailConfiguration() {
  const keys = [
    "email.smtpHost",
    "email.smtpPort",
    "email.smtpSecure",
    "email.smtpUser",
    "email.smtpPassword",
    "email.fromName",
    "email.fromAddress",
  ] as const;
  const values = await Promise.all(keys.map((key) => getSystemSetting(key)));
  const configured = Object.fromEntries(
    keys.map((key, index) => [key, values[index]]),
  );
  const host = configured["email.smtpHost"] || process.env.SMTP_HOST;
  const port = Number(
    configured["email.smtpPort"] || process.env.SMTP_PORT || 587,
  );
  const user = configured["email.smtpUser"] || process.env.SMTP_USER;
  const password =
    configured["email.smtpPassword"] || process.env.SMTP_PASSWORD;
  const fromAddress =
    configured["email.fromAddress"] || process.env.SMTP_FROM_EMAIL;
  if (!host || !user || !password || !fromAddress || !Number.isInteger(port))
    throw new Error("EMAIL_NOT_CONFIGURED");
  return {
    host,
    port,
    secure:
      (configured["email.smtpSecure"] || process.env.SMTP_SECURE) === "true",
    user,
    password,
    fromName:
      configured["email.fromName"] ||
      process.env.SMTP_FROM_NAME ||
      "ReviewReply AI",
    fromAddress,
  };
}
