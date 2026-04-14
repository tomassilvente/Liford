-- AlterTable
ALTER TABLE "RecurringExpense" ADD COLUMN     "foreignAccountId" TEXT,
ADD COLUMN     "walletId" TEXT;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_foreignAccountId_fkey" FOREIGN KEY ("foreignAccountId") REFERENCES "ForeignAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
