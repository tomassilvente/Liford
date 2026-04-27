export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { TransactionType } from "@/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import TransaccionesView from "./TransaccionesView";

const CATS_GASTO  = ["Alimentación","Transporte","Entretenimiento","Salud","Servicios","Ropa","Educación","Suscripciones","Otro"];
const CATS_INGRESO = ["Sueldo","Freelance","Fotografía","Venta","Inversión","Transferencia recibida","Reembolso","Otro"];

export default async function TransaccionesPage() {
  const { userId } = await requireSession();

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [transactions, wallets, foreignAccounts, recurringIds] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: oneYearAgo } },
      orderBy: { date: "desc" },
    }),
    db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.foreignAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    // Queremos saber qué transacciones vinieron de recurrentes (tienen descripción que coincide)
    db.recurringExpense.findMany({ where: { userId }, select: { description: true } }),
  ]);

  const recurringDescs = new Set(recurringIds.map((r) => r.description));

  const serialized = transactions.map((t) => ({
    id: t.id,
    type: t.type as "EXPENSE" | "INCOME" | "STOCK_PURCHASE" | "CRYPTO_PURCHASE",
    amount: t.amount,
    currency: t.currency,
    category: t.category,
    description: t.description,
    source: t.source,
    date: t.date.toISOString(),
    isRecurring: t.description ? recurringDescs.has(t.description) : false,
  }));

  const categories = Array.from(new Set([...CATS_GASTO, ...CATS_INGRESO]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Transacciones</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-400">
        Todos tus movimientos — filtrá por tipo, categoría o buscá por nombre.
      </p>
      <TransaccionesView
        transactions={serialized}
        categories={categories}
        wallets={wallets.map((w) => ({ id: w.id, name: w.name, currency: w.currency }))}
        foreignAccounts={foreignAccounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency }))}
      />
    </div>
  );
}
