import { db } from "@/lib/db";
import { TransactionType } from "@/generated/prisma/enums";

export async function applyRecurringExpenses(userId: string): Promise<void> {
  const now = new Date();
  const today = now.getDate();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const pending = await db.recurringExpense.findMany({
    where: {
      userId,
      isActive: true,
      dayOfMonth: { lte: today },
      OR: [{ lastApplied: null }, { lastApplied: { lt: thisMonthStart } }],
    },
  });

  if (pending.length === 0) return;

  const isExpense = (type: TransactionType) => type === TransactionType.EXPENSE;

  await db.$transaction([
    ...pending.map((r) =>
      db.transaction.create({
        data: {
          userId,
          type: r.transactionType,
          amount: r.amount,
          currency: r.currency,
          category: r.category,
          description: r.description,
          source: r.source,
          date: new Date(now.getFullYear(), now.getMonth(), r.dayOfMonth),
        },
      })
    ),
    // Adjust wallet balance: decrement for expenses, increment for income
    ...pending
      .filter((r) => r.walletId)
      .map((r) =>
        db.wallet.update({
          where: { id: r.walletId! },
          data: {
            balance: isExpense(r.transactionType)
              ? { decrement: r.amount }
              : { increment: r.amount },
          },
        })
      ),
    ...pending
      .filter((r) => r.foreignAccountId)
      .map((r) =>
        db.foreignAccount.update({
          where: { id: r.foreignAccountId! },
          data: {
            balance: isExpense(r.transactionType)
              ? { decrement: r.amount }
              : { increment: r.amount },
          },
        })
      ),
    db.recurringExpense.updateMany({
      where: { id: { in: pending.map((r) => r.id) } },
      data: { lastApplied: now },
    }),
  ]);
}
