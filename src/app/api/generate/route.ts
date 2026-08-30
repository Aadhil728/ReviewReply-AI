import { UsageAction, UsageStatus } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { aiProvider, AIProviderError } from "@/lib/ai/provider";
import {
  buildGenerationMessages,
  buildRewriteMessages,
} from "@/lib/ai/prompts";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createErrorId, logger } from "@/lib/logger";
import { getUserEntitlements } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  completeGeneration,
  IdempotencyConflictError,
  releaseGeneration,
  reserveGeneration,
  UsageLimitError,
} from "@/lib/usage";

const actionSchema = z.enum(UsageAction);
const schema = z.object({
  businessId: z.string().min(1).optional(),
  requestKey: z.uuid(),
  reviewText: z.string().trim().min(3).max(3000),
  rating: z.number().int().min(1).max(5),
  tone: z.string().max(30),
  responseLength: z.string().max(20),
  language: z.string().max(30),
  action: actionSchema.default(UsageAction.GENERATE),
  existingResponse: z.string().max(5000).optional(),
});

function generationError(error: unknown) {
  if (error instanceof Error && error.message === "AI_NOT_CONFIGURED")
    return {
      message:
        "AI generation is not configured yet. Ask the site administrator to add a provider key.",
      category: "NOT_CONFIGURED",
    };
  if (error instanceof AIProviderError) {
    if (error.code === "AUTH")
      return {
        message:
          "The AI provider configuration needs attention. Contact the site administrator.",
        category: "AUTH",
      };
    if (error.code === "QUOTA")
      return {
        message:
          "The AI service allowance is temporarily unavailable. Please try again later.",
        category: "QUOTA",
      };
    if (error.code === "REQUEST")
      return {
        message: "The configured AI model is currently unavailable.",
        category: "REQUEST",
      };
    return {
      message: "The AI provider is temporarily unavailable. Please try again.",
      category: "UNAVAILABLE",
    };
  }
  return {
    message: "Couldn't generate a reply. Please try again.",
    category: "UNKNOWN",
  };
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  });
  if (!user?.isActive)
    return NextResponse.json(
      { error: "This account is not active." },
      { status: 403 },
    );

  const rateLimit = await checkRateLimit(`ai:${session.user.id}`, 8, 60_000);
  if (!rateLimit.allowed)
    return NextResponse.json(
      {
        error: "Please wait a moment before generating again.",
        resetAt: rateLimit.resetAt,
      },
      { status: 429 },
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body is not valid JSON." },
      { status: 400 },
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check the review and response options." },
      { status: 400 },
    );

  const business = await db.business.findFirst({
    where: {
      userId: session.user.id,
      ...(parsed.data.businessId ? { id: parsed.data.businessId } : {}),
    },
  });
  if (!business)
    return NextResponse.json(
      { error: "Complete your business profile first." },
      { status: 400 },
    );
  const entitlements = await getUserEntitlements(session.user.id);

  let reservation: Awaited<ReturnType<typeof reserveGeneration>>;
  try {
    reservation = await reserveGeneration({
      userId: session.user.id,
      requestKey: parsed.data.requestKey,
      action: parsed.data.action,
      limit: entitlements.generationLimit,
    });
  } catch (error) {
    if (error instanceof UsageLimitError)
      return NextResponse.json(
        {
          error: "You've reached your monthly AI generation limit.",
          resetAt: entitlements.resetAt,
        },
        { status: 403 },
      );
    if (error instanceof IdempotencyConflictError)
      return NextResponse.json(
        { error: "This request key has already been used." },
        { status: 409 },
      );
    throw error;
  }

  if (reservation.duplicate) {
    if (
      reservation.event.status === UsageStatus.COMPLETED &&
      reservation.event.generationId
    ) {
      const generation = await db.reviewGeneration.findFirst({
        where: { id: reservation.event.generationId, userId: session.user.id },
      });
      if (generation) {
        const usage = await db.usageRecord.findUnique({
          where: {
            userId_period: {
              userId: session.user.id,
              period: entitlements.period,
            },
          },
        });
        return NextResponse.json({
          reply: generation.finalResponse ?? generation.generatedResponse,
          id: generation.id,
          used: usage?.generationsUsed ?? 0,
          total: entitlements.generationLimit,
          resetAt: entitlements.resetAt,
        });
      }
    }
    return NextResponse.json(
      {
        error:
          "This generation request is already being processed or was released. Please try again.",
      },
      { status: 409 },
    );
  }

  try {
    const isRewrite =
      parsed.data.action !== UsageAction.GENERATE &&
      parsed.data.existingResponse;
    const messages = isRewrite
      ? buildRewriteMessages(parsed.data.existingResponse!, parsed.data.action)
      : buildGenerationMessages({ ...parsed.data, business });
    const result = await aiProvider.generate(messages);
    const completed = await completeGeneration({
      eventId: reservation.event.id,
      userId: session.user.id,
      period: entitlements.period,
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.tokensUsed,
      generation: {
        userId: session.user.id,
        businessId: business.id,
        reviewText: parsed.data.reviewText,
        rating: parsed.data.rating,
        tone: parsed.data.tone,
        responseLength: parsed.data.responseLength,
        language: parsed.data.language,
        generatedResponse: result.text,
        model: result.model,
        provider: result.provider,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        tokensUsed: result.tokensUsed,
        action: parsed.data.action,
      },
    });
    return NextResponse.json({
      reply: result.text,
      id: completed.generation.id,
      used: completed.usage.generationsUsed,
      total: entitlements.generationLimit,
      resetAt: entitlements.resetAt,
    });
  } catch (error) {
    const mapped = generationError(error);
    await releaseGeneration(reservation.event.id, mapped.category);
    const errorId = createErrorId();
    logger.error("ai_generation_failed", {
      errorId,
      userId: session.user.id,
      category: mapped.category,
    });
    return NextResponse.json(
      { error: mapped.message, errorId },
      { status: 503 },
    );
  }
}
