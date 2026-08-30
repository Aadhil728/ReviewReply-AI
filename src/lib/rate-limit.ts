import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function checkRateLimit(
  key: string,
  limit = 8,
  windowMs = 60_000,
) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  return db.$transaction(
    async (transaction) => {
      const current = await transaction.rateLimitBucket.findUnique({
        where: { key },
      });
      if (!current || current.expiresAt <= now) {
        await transaction.rateLimitBucket.upsert({
          where: { key },
          create: { key, count: 1, expiresAt },
          update: { count: 1, expiresAt },
        });
        return { allowed: true, remaining: limit - 1, resetAt: expiresAt };
      }
      const updated = await transaction.rateLimitBucket.updateMany({
        where: { key, count: { lt: limit }, expiresAt: { gt: now } },
        data: { count: { increment: 1 } },
      });
      return {
        allowed: updated.count === 1,
        remaining: Math.max(0, limit - current.count - 1),
        resetAt: current.expiresAt,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export function getClientAddress(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
