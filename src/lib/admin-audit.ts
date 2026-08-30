import "server-only";
import type { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function recordAdminAction(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip");
  await db.adminAuditLog.create({ data: { ...input, ipAddress } });
}
