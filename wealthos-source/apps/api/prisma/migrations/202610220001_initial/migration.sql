CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TABLE "Workspace" (
  "id" UUID NOT NULL, "name" VARCHAR(100) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "User" (
  "id" UUID NOT NULL, "email" VARCHAR(254) NOT NULL, "name" VARCHAR(100) NOT NULL,
  "passwordHash" TEXT NOT NULL, "workspaceId" UUID NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Account" (
  "id" UUID NOT NULL, "workspaceId" UUID NOT NULL, "name" VARCHAR(100) NOT NULL,
  "institution" VARCHAR(100) NOT NULL, "color" VARCHAR(7) NOT NULL DEFAULT '#8b5cf6',
  "openingBalanceCents" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Account_openingBalanceCents_check" CHECK ("openingBalanceCents" BETWEEN -1000000000 AND 1000000000)
);
CREATE TABLE "Transaction" (
  "id" UUID NOT NULL, "workspaceId" UUID NOT NULL, "accountId" UUID NOT NULL,
  "description" VARCHAR(200) NOT NULL, "amountCents" INTEGER NOT NULL,
  "type" "TransactionType" NOT NULL, "category" VARCHAR(80) NOT NULL, "date" VARCHAR(10) NOT NULL,
  "idempotencyKey" VARCHAR(100) NOT NULL, "reversedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Transaction_amountCents_check" CHECK ("amountCents" > 0 AND "amountCents" <= 1000000000)
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_id_workspaceId_key" ON "Account"("id", "workspaceId");
CREATE INDEX "Account_workspaceId_idx" ON "Account"("workspaceId");
CREATE UNIQUE INDEX "Transaction_workspaceId_idempotencyKey_key" ON "Transaction"("workspaceId", "idempotencyKey");
CREATE INDEX "Transaction_workspaceId_date_idx" ON "Transaction"("workspaceId", "date");
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_workspaceId_fkey" FOREIGN KEY ("accountId", "workspaceId") REFERENCES "Account"("id", "workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;
