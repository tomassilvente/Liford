export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";
import BudgetManager from "./BudgetManager";
import MonthFilter from "@/components/finanzas/MonthFilter";

const CATEGORIAS_GASTO = [
  "Alimentación", "Transporte", "Entretenimiento", "Salud",
  "Servicios", "Ropa", "Educación", "Suscripciones", "Otro",
];

function currentYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function PresupuestoPage({
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

  const [budgets, gastosMes] = await Promise.all([
    db.budget.findMany({ where: { userId }, orderBy: { category: "asc" } }),
    db.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        source: TransactionSource.PERSONAL,
        currency: "ARS",
        date: { gte: from, lt: to },
      },
    }),
  ]);

  // Agrupar gastos del mes por categoría
  const gastoPorCategoria: Record<string, number> = {};
  for (const t of gastosMes) {
    gastoPorCategoria[t.category] = (gastoPorCategoria[t.category] ?? 0) + t.amount;
  }

  const totalGastado = gastosMes.reduce((s, t) => s + t.amount, 0);
  const totalPresupuestado = budgets.reduce((s, b) => s + b.monthlyLimit, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Presupuesto</h1>
      <p className="mt-1 text-neutral-400">Límites mensuales por categoría en ARS</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <MonthFilter selected={ym} />
        {totalPresupuestado > 0 && (
          <div className="flex gap-3">
            <div className="rounded-xl bg-neutral-800 px-4 py-3">
              <p className="text-xs text-neutral-400">Gastado</p>
              <p className="mt-0.5 text-base font-bold text-red-400">
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(totalGastado)}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-800 px-4 py-3">
              <p className="text-xs text-neutral-400">Presupuestado</p>
              <p className="mt-0.5 text-base font-bold text-white">
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(totalPresupuestado)}
              </p>
            </div>
            <div className={`rounded-xl px-4 py-3 ${totalGastado <= totalPresupuestado ? "bg-green-950" : "bg-red-950"}`}>
              <p className="text-xs text-neutral-400">Disponible</p>
              <p className={`mt-0.5 text-base font-bold ${totalGastado <= totalPresupuestado ? "text-green-400" : "text-red-400"}`}>
                {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(totalPresupuestado - totalGastado)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <BudgetManager
          budgets={budgets.map((b) => ({
            id: b.id,
            category: b.category,
            monthlyLimit: b.monthlyLimit,
            currency: b.currency,
          }))}
          gastoPorCategoria={gastoPorCategoria}
          categorias={CATEGORIAS_GASTO}
        />
      </div>
    </div>
  );
}
