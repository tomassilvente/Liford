export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { getUserWallets, getUserForeignAccounts, getUserCategories } from "@/lib/queries";
import TransaccionesView from "./TransaccionesView";

function currentYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function TransaccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; tipo?: string }>;
}) {
  const { userId } = await requireSession();
  const { mes, tipo } = await searchParams;

  const ym = mes ?? currentYM();
  const [selYear, selMonth] = ym.split("-").map(Number);
  const startOfMonth  = new Date(selYear, selMonth - 1, 1);
  const endOfMonth    = new Date(selYear, selMonth,     1);
  const prevMonthStart = new Date(selYear, selMonth - 2, 1);
  const nextMonthEnd   = new Date(selYear, selMonth + 1, 1);

  const [transactions, wallets, foreignAccounts, userCategories, prevFirst, nextFirst] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: startOfMonth, lt: endOfMonth } },
      orderBy: { date: "desc" },
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        category: true,
        description: true,
        source: true,
        date: true,
        recurrentRuleId: true,
      },
    }),
    getUserWallets(userId),
    getUserForeignAccounts(userId),
    getUserCategories(userId),
    db.transaction.findFirst({ where: { userId, date: { gte: prevMonthStart, lt: startOfMonth } }, select: { id: true } }),
    db.transaction.findFirst({ where: { userId, date: { gte: endOfMonth, lt: nextMonthEnd   } }, select: { id: true } }),
  ]);

  const serialized = transactions.map((t) => ({
    id:              t.id,
    type:            t.type as "EXPENSE" | "INCOME" | "STOCK_PURCHASE" | "CRYPTO_PURCHASE",
    amount:          t.amount,
    currency:        t.currency,
    category:        t.category,
    description:     t.description,
    source:          t.source,
    date:            t.date.toISOString(),
    isRecurring:     t.recurrentRuleId != null,
    recurrentRuleId: t.recurrentRuleId,
  }));

  return (
    <TransaccionesView
      transactions={serialized}
      mesYM={ym}
      prevHasData={prevFirst != null}
      nextHasData={nextFirst != null}
      wallets={wallets.map((w) => ({ id: w.id, name: w.name, currency: w.currency }))}
      foreignAccounts={foreignAccounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency }))}
      userCategories={userCategories.map((c) => ({ name: c.name, icon: c.icon ?? "", type: c.type }))}
      initialTipo={(tipo === "expense" ? "EXPENSE" : tipo === "income" ? "INCOME" : "") as "" | "EXPENSE" | "INCOME"}
    />
  );
}
