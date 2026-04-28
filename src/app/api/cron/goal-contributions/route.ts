import { db } from "@/lib/db";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";

// Protegido por CRON_SECRET en el header Authorization
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = now.getDate();

  // Buscar metas con aporte automático configurado para hoy
  const goals = await db.savingsGoal.findMany({
    where: {
      isAchieved: false,
      autoContributionAmount: { not: null },
      autoContributionDay: today,
    },
  });

  const results: { goalId: string; status: string; error?: string }[] = [];

  for (const goal of goals) {
    if (!goal.autoContributionAmount || !goal.autoContributionFromWallet) continue;

    try {
      const [accountType, accountId] = goal.autoContributionFromWallet.split(":");

      await db.$transaction(async (tx) => {
        // Registrar la transacción de aporte
        await tx.transaction.create({
          data: {
            userId: goal.userId,
            type: TransactionType.INCOME,
            source: TransactionSource.PERSONAL,
            amount: goal.autoContributionAmount!,
            currency: goal.currency,
            category: "Ahorro",
            description: `Aporte automático — ${goal.name}`,
            date: now,
          },
        });

        // Actualizar el balance de la cuenta destino de la meta
        if (goal.walletId) {
          await tx.wallet.update({
            where: { id: goal.walletId },
            data: { balance: { increment: goal.autoContributionAmount! } },
          });
        } else if (goal.foreignAccountId) {
          await tx.foreignAccount.update({
            where: { id: goal.foreignAccountId },
            data: { balance: { increment: goal.autoContributionAmount! } },
          });
        }

        // Decrementar la cuenta origen
        if (accountType === "wallet") {
          await tx.wallet.update({
            where: { id: accountId },
            data: { balance: { decrement: goal.autoContributionAmount! } },
          });
        } else if (accountType === "foreign") {
          await tx.foreignAccount.update({
            where: { id: accountId },
            data: { balance: { decrement: goal.autoContributionAmount! } },
          });
        }
      });

      results.push({ goalId: goal.id, status: "ok" });
    } catch (err) {
      results.push({ goalId: goal.id, status: "error", error: String(err) });
    }
  }

  return Response.json({ processed: results.length, results });
}
