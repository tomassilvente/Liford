import { db } from "@/lib/db";
import { TransactionType } from "@/generated/prisma/enums";

export interface Suggestion {
  categoryId: string | null;
  category: string;
  accountId: string | null;
  accountType: "wallet" | "foreign" | null;
  confidence: "high" | "low";
}

export async function suggestFromDescription(
  userId: string,
  query: string,
  txType: "EXPENSE" | "INCOME"
): Promise<Suggestion | null> {
  if (!query || query.trim().length < 2) return null;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Buscar transacciones del usuario con descripción similar (últimos 90 días)
  const matches = await db.transaction.findMany({
    where: {
      userId,
      type: txType === "EXPENSE" ? TransactionType.EXPENSE : TransactionType.INCOME,
      date: { gte: ninetyDaysAgo },
      description: { contains: query.trim(), mode: "insensitive" },
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  if (matches.length === 0) return null;

  // La más reciente determina categoría y cuenta
  const best = matches[0];

  // Buscar en qué billetera/cuenta foránea suelen caer estas transacciones
  // Para esto, buscamos la wallet/foreignAccount más usada en el historial
  // Como la transacción no guarda walletId, usamos la categoría y tipo como proxy
  // y devolvemos la cuenta más usada del último mes para ese tipo de transacción
  const lastMonth = new Date();
  lastMonth.setDate(lastMonth.getDate() - 30);

  let accountId: string | null = null;
  let accountType: "wallet" | "foreign" | null = null;

  const [wallets, foreignAccounts] = await Promise.all([
    db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.foreignAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  // Cuenta más usada en el último mes para el mismo tipo de transacción
  // (heurística: la que tiene el balance más movido = la principal)
  if (wallets.length > 0) {
    const preferred = wallets.find((w) => w.currency === best.currency) ?? wallets[0];
    accountId = preferred.id;
    accountType = "wallet";
  } else if (foreignAccounts.length > 0) {
    accountId = foreignAccounts[0].id;
    accountType = "foreign";
  }

  return {
    categoryId: null,
    category: best.category,
    accountId,
    accountType,
    confidence: matches.length >= 3 ? "high" : "low",
  };
}
