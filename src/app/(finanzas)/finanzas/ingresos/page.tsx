export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import type { TransactionModel as Transaction } from "@/generated/prisma/models";
import IngresoForm from "@/components/finanzas/IngresoForm";
import TransactionRow from "@/components/finanzas/TransactionRow";
import MonthFilter from "@/components/finanzas/MonthFilter";

const CATEGORIAS_INGRESO = [
  "Sueldo", "Freelance", "Fotografía", "Venta", "Inversión",
  "Transferencia recibida", "Reembolso", "Otro",
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

export default async function IngresosPage({
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

  const [wallets, ingresos] = await Promise.all([
    db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.transaction.findMany({
      where: {
        userId,
        type: TransactionType.INCOME,
        source: TransactionSource.PERSONAL,
        date: { gte: from, lt: to },
      },
      orderBy: { date: "desc" },
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

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <MonthFilter selected={ym} />
        {Object.entries(totalPorMoneda).map(([currency, total]) => (
          <div key={currency} className="rounded-xl bg-neutral-800 px-5 py-3">
            <p className="text-xs text-neutral-400">Total ingresos ({currency})</p>
            <p className="mt-1 text-lg font-bold text-green-400">
              {formatCurrency(total as number, currency)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {ingresos.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay ingresos registrados en este período.</p>
        ) : (
          <div className="rounded-lg bg-neutral-800 divide-y divide-neutral-700">
            {ingresos.map((t: Transaction) => (
              <TransactionRow
                key={t.id}
                id={t.id}
                description={t.description ?? ""}
                category={t.category}
                date={t.date.toISOString()}
                amount={t.amount}
                currency={t.currency}
                type="INCOME"
                categories={CATEGORIAS_INGRESO}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
