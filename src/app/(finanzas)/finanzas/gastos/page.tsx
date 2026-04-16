export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import type { TransactionModel as Transaction } from "@/generated/prisma/models";
import GastoForm from "@/components/finanzas/GastoForm";
import TransactionRow from "@/components/finanzas/TransactionRow";
import MonthFilter from "@/components/finanzas/MonthFilter";

const CATEGORIAS_GASTO = [
  "Alimentación", "Transporte", "Entretenimiento", "Salud",
  "Servicios", "Ropa", "Educación", "Suscripciones", "Otro",
];

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function currentYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { userId } = await requireSession();
  const { mes } = await searchParams;

  const ym = mes ?? currentYM();
  const [year, month] = ym.split("-").map(Number);
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  const [wallets, foreignAccounts, gastos] = await Promise.all([
    db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.foreignAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        source: TransactionSource.PERSONAL,
        date: { gte: from, lt: to },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalPorMoneda = gastos.reduce<Record<string, number>>(
    (acc, g: Transaction) => {
      acc[g.currency] = (acc[g.currency] ?? 0) + g.amount;
      return acc;
    },
    {}
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Gastos</h1>
      <p className="mt-1 text-neutral-400">Registrá y revisá tus gastos</p>

      <div className="mt-6">
        <GastoForm wallets={wallets} foreignAccounts={foreignAccounts} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <MonthFilter selected={ym} />
        {Object.entries(totalPorMoneda).map(([currency, total]) => (
          <div key={currency} className="rounded-xl bg-neutral-800 px-5 py-3">
            <p className="text-xs text-neutral-400">Total gastos ({currency})</p>
            <p className="mt-1 text-lg font-bold text-red-400">
              {formatCurrency(total as number, currency)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {gastos.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay gastos registrados en este período.</p>
        ) : (
          <div className="rounded-lg bg-neutral-800 divide-y divide-neutral-700">
            {gastos.map((g: Transaction) => (
              <TransactionRow
                key={g.id}
                id={g.id}
                description={g.description ?? ""}
                category={g.category}
                date={g.date.toISOString()}
                amount={g.amount}
                currency={g.currency}
                type="EXPENSE"
                categories={CATEGORIAS_GASTO}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
