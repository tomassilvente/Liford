-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Insert the real user (tomas) — password will be updated by seed script
INSERT INTO "User" ("id", "username", "passwordHash", "displayName", "createdAt")
VALUES ('user_tomas', 'tomas', 'PLACEHOLDER', 'Tomas', NOW());

-- AlterTable: add nullable userId first
ALTER TABLE "Client" ADD COLUMN "userId" TEXT;
ALTER TABLE "ForeignAccount" ADD COLUMN "userId" TEXT;
ALTER TABLE "Investment" ADD COLUMN "userId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "userId" TEXT;
ALTER TABLE "Wallet" ADD COLUMN "userId" TEXT;

-- Assign all existing rows to tomas
UPDATE "Client" SET "userId" = 'user_tomas';
UPDATE "ForeignAccount" SET "userId" = 'user_tomas';
UPDATE "Investment" SET "userId" = 'user_tomas';
UPDATE "Transaction" SET "userId" = 'user_tomas';
UPDATE "Wallet" SET "userId" = 'user_tomas';

-- Now make userId NOT NULL
ALTER TABLE "Client" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "ForeignAccount" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Investment" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Wallet" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ForeignAccount" ADD CONSTRAINT "ForeignAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
