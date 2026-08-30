-- Production foundation. Existing subscription rows are migrated to typed plans
-- before legacy columns are removed.
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "PlanCode" AS ENUM ('FREE', 'PRO', 'AGENCY');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('STRIPE', 'PAYPAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UsageAction" AS ENUM ('GENERATE', 'REGENERATE', 'MAKE_SHORTER', 'MAKE_FRIENDLIER', 'MAKE_MORE_PROFESSIONAL', 'ADD_EMPATHY');

-- CreateEnum
CREATE TYPE "UsageStatus" AS ENUM ('RESERVED', 'COMPLETED', 'RELEASED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- AlterTable
ALTER TABLE "ReviewGeneration" ADD COLUMN     "action" "UsageAction" NOT NULL DEFAULT 'GENERATE',
ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "outputTokens" INTEGER,
ADD COLUMN     "provider" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "action" "UsageAction" NOT NULL,
    "status" "UsageStatus" NOT NULL DEFAULT 'RESERVED',
    "provider" TEXT,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "failureCategory" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "generationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" "PlanCode" NOT NULL,
    "name" TEXT NOT NULL,
    "generationLimit" INTEGER NOT NULL,
    "businessLimit" INTEGER NOT NULL,
    "monthlyPriceCents" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Plan" ("id", "code", "name", "generationLimit", "businessLimit", "monthlyPriceCents", "sortOrder", "updatedAt") VALUES
  ('plan_free', 'FREE', 'Free', 10, 1, 0, 0, CURRENT_TIMESTAMP),
  ('plan_pro', 'PRO', 'Pro', 200, 1, 1900, 1, CURRENT_TIMESTAMP),
  ('plan_agency', 'AGENCY', 'Agency', 1000, 10, 4900, 2, CURRENT_TIMESTAMP);

ALTER TABLE "Subscription"
ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "externalCustomerId" TEXT,
ADD COLUMN "gracePeriodEnd" TIMESTAMP(3),
ADD COLUMN "planId" TEXT,
ADD COLUMN "provider" "BillingProvider",
ADD COLUMN "statusTyped" "SubscriptionStatus" NOT NULL DEFAULT 'UNPAID';

UPDATE "Subscription"
SET "planId" = CASE UPPER(COALESCE("plan", 'FREE'))
  WHEN 'PRO' THEN 'plan_pro'
  WHEN 'AGENCY' THEN 'plan_agency'
  ELSE 'plan_free'
END,
"provider" = CASE UPPER(COALESCE("billingProvider", ''))
  WHEN 'STRIPE' THEN 'STRIPE'::"BillingProvider"
  WHEN 'PAYPAL' THEN 'PAYPAL'::"BillingProvider"
  ELSE NULL
END,
"statusTyped" = CASE UPPER(COALESCE("status", ''))
  WHEN 'ACTIVE' THEN 'ACTIVE'::"SubscriptionStatus"
  WHEN 'TRIALING' THEN 'TRIALING'::"SubscriptionStatus"
  WHEN 'PAST_DUE' THEN 'PAST_DUE'::"SubscriptionStatus"
  WHEN 'CANCELED' THEN 'CANCELED'::"SubscriptionStatus"
  WHEN 'EXPIRED' THEN 'EXPIRED'::"SubscriptionStatus"
  ELSE 'UNPAID'::"SubscriptionStatus"
END;

ALTER TABLE "Subscription"
ALTER COLUMN "planId" SET NOT NULL,
DROP COLUMN "billingProvider",
DROP COLUMN "plan",
DROP COLUMN "status";

ALTER TABLE "Subscription" RENAME COLUMN "statusTyped" TO "status";

-- CreateTable
CREATE TABLE "ProviderPrice" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "externalProductId" TEXT,
    "externalPriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "InstallationState" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "installed" BOOLEAN NOT NULL DEFAULT false,
    "installedAt" TIMESTAMP(3),
    "version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "payloadHash" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsageEvent_requestKey_key" ON "UsageEvent"("requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "UsageEvent_generationId_key" ON "UsageEvent"("generationId");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_period_status_idx" ON "UsageEvent"("userId", "period", "status");

-- CreateIndex
CREATE INDEX "UsageEvent_status_expiresAt_idx" ON "UsageEvent"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderPrice_planId_provider_key" ON "ProviderPrice"("planId", "provider");

-- CreateIndex
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- CreateIndex
CREATE INDEX "SystemSetting_group_idx" ON "SystemSetting"("group");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_createdAt_idx" ON "WebhookEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_externalEventId_key" ON "WebhookEvent"("provider", "externalEventId");

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "ReviewGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPrice" ADD CONSTRAINT "ProviderPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
