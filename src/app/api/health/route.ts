import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEnvironmentStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const environment = getEnvironmentStatus();
    return NextResponse.json(
      {
        status: environment.valid ? "ok" : "degraded",
        database: "reachable",
        environment: environment.valid ? "configured" : "incomplete",
        version: process.env.npm_package_version ?? "unknown",
        responseTimeMs: Date.now() - started,
      },
      { status: environment.valid ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "unreachable",
        version: process.env.npm_package_version ?? "unknown",
        responseTimeMs: Date.now() - started,
      },
      { status: 503 },
    );
  }
}
