export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import TransaccionesView from "./TransaccionesView";

export default async function TransaccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; rango?: string }>;
}) {
  const { userId } = await requireSession();
  const { tipo, rango } = await searchParams;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [transactions, wallets, foreignAccounts, userCategories] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: oneYearAgo } },
      orderBy: { date: "desc" },
    }),
    db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.foreignAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.category.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const serialized = transactions.map((t) => ({
    id: t.id,
    type: t.type as "EXPENSE" | "INCOME" | "STOCK_PURCHASE" | "CRYPTO_PURCHASE",
    amount: t.amount,
    currency: t.currency,
    category: t.category,
    description: t.description,
    source: t.source,
    date: t.date.toISOString(),
    isRecurring: t.recurrentRuleId != null,
    recurrentRuleId: t.recurrentRuleId,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Transacciones</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-400">
        Todos tus movimientos — filtrá por tipo, categoría o buscá por nombre.
      </p>
      <TransaccionesView
        transactions={serialized}
        wallets={wallets.map((w) => ({ id: w.id, name: w.name, currency: w.currency }))}
        foreignAccounts={foreignAccounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency }))}
        userCategories={userCategories.map((c) => ({ name: c.name, icon: c.icon ?? "", type: c.type }))}
        initialTipo={(tipo === "expense" ? "EXPENSE" : tipo === "income" ? "INCOME" : "") as "" | "EXPENSE" | "INCOME"}
        initialRange={(rango as "week" | "month" | "3m" | "year" | "ytd" | "all") ?? "month"}
      />
    </div>
  );
}
