export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";
import type { TransactionModel as Transaction } from "@/generated/prisma/models";
import IngresoForm from "@/components/finanzas/IngresoForm";

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

export default async function IngresosPage() {
  const [wallets, ingresos] = await Promise.all([
    db.wallet.findMany({ orderBy: { name: "asc" } }),
    db.transaction.findMany({
      where: {
        type: TransactionType.INCOME,
        source: TransactionSource.PERSONAL,
      },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ]);

  const totalPorMoneda = ingresos.reduce<Record<string, number>>(
    (acc, t: Transaction) => {
      acc[t.currency] = (acc[t.currency] ?? 0) + t.amount;
      return acc;
    },
    {}
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Ingresos</h1>
      <p className="mt-1 text-neutral-400">Registrá y revisá tus ingresos</p>

      <div className="mt-6">
        <IngresoForm wallets={wallets} />
      </div>

      {ingresos.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {Object.entries(totalPorMoneda).map(([currency, total]) => (
            <div key={currency} className="rounded-xl bg-neutral-800 px-5 py-3">
              <p className="text-xs text-neutral-400">Total ingresos ({currency})</p>
              <p className="mt-1 text-lg font-bold text-green-400">
                {formatCurrency(total as number, currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-neutral-400">Últimos ingresos</h2>

        {ingresos.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no registraste ningún ingreso.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {ingresos.map((t: Transaction) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-neutral-800 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{t.description}</p>
                  <p className="text-xs text-neutral-500">
                    {t.category} · {formatDate(t.date)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-green-400">
                  +{formatCurrency(t.amount, t.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
