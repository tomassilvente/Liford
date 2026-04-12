export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";
import type { TransactionModel as Transaction } from "@/generated/prisma/models";
import GastoForm from "@/components/finanzas/GastoForm";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function GastosPage() {
  const [wallets, gastos] = await Promise.all([
    db.wallet.findMany({ orderBy: { name: "asc" } }),
    db.transaction.findMany({
      where: {
        type: TransactionType.EXPENSE,
        source: TransactionSource.PERSONAL,
      },
      orderBy: { date: "desc" },
      take: 50,
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
        <GastoForm wallets={wallets} />
      </div>

      {/* Totales rápidos */}
      {gastos.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {Object.entries(totalPorMoneda).map(([currency, total]) => (
            <div key={currency} className="rounded-xl bg-neutral-800 px-5 py-3">
              <p className="text-xs text-neutral-400">Total gastos ({currency})</p>
              <p className="mt-1 text-lg font-bold text-red-400">
                {formatCurrency(total as number, currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Lista de gastos */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-neutral-400">Últimos gastos</h2>

        {gastos.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no registraste ningún gasto.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {gastos.map((g: Transaction) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-lg bg-neutral-800 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{g.description}</p>
                    <p className="text-xs text-neutral-500">
                      {g.category} · {formatDate(g.date)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-red-400">
                  -{formatCurrency(g.amount, g.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
