import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sensitive =
    pathname.includes("sign-in") || pathname.includes("sign-up");
  const result = await checkRateLimit(
    `auth:${getClientAddress(request)}`,
    sensitive ? 10 : 30,
    sensitive ? 15 * 60_000 : 60_000,
  );
  if (!result.allowed)
    return NextResponse.json(
      { message: "Too many authentication attempts. Please try again later." },
      { status: 429 },
    );
  return handlers.POST(request);
}
