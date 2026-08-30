ALTER TABLE "Subscription" ADD COLUMN "providerUpdatedAt" TIMESTAMP(3);
ALTER TABLE "WebhookEvent" ADD COLUMN "occurredAt" TIMESTAMP(3);
