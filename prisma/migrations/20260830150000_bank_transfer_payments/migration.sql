ALTER TYPE "BillingProvider" ADD VALUE 'BANK_TRANSFER';

CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

CREATE TABLE "BankTransferRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "transferReference" TEXT,
    "customerNote" TEXT,
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BankTransferRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BankTransferRequest_status_createdAt_idx" ON "BankTransferRequest"("status", "createdAt");
CREATE INDEX "BankTransferRequest_userId_createdAt_idx" ON "BankTransferRequest"("userId", "createdAt");
ALTER TABLE "BankTransferRequest" ADD CONSTRAINT "BankTransferRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankTransferRequest" ADD CONSTRAINT "BankTransferRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
