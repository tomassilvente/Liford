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
      where: { userId, type: TransactionType.EXPENSE, source: TransactionSource.PERSONAL, date: { gte: from, lt: to } },
    }),
  ]);

  const gastoPorCategoria: Record<string, number> = {};
  const gastoPorCategoriaUSD: Record<string, number> = {};
  for (const t of gastosMes) {
    if (t.currency === "ARS") {
      gastoPorCategoria[t.category] = (gastoPorCategoria[t.category] ?? 0) + t.amount;
    } else {
      gastoPorCategoriaUSD[t.category] = (gastoPorCategoriaUSD[t.category] ?? 0) + t.amount;
    }
  }

  const arsPresupuestado = budgets.filter((b) => b.currency === "ARS").reduce((s, b) => s + b.monthlyLimit, 0);
  const usdPresupuestado = budgets.filter((b) => b.currency === "USD").reduce((s, b) => s + b.monthlyLimit, 0);
  const arsGastado = gastosMes.filter((t) => t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
  const usdGastado = gastosMes.filter((t) => t.currency === "USD").reduce((s, t) => s + t.amount, 0);

  const fmtARS = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

  // Categorías disponibles: las predefinidas + las ya usadas en presupuesto
  const todasLasCats = Array.from(new Set([...CATEGORIAS_GASTO, ...budgets.map((b) => b.category)])).sort();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Presupuesto</h1>
      <p className="mt-1 text-neutral-400 text-sm">Límites mensuales por categoría — ARS y USD</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <MonthFilter selected={ym} />
        <div className="flex flex-wrap gap-3">
          {arsPresupuestado > 0 && (
            <>
              <div className="rounded-xl bg-neutral-800 px-4 py-3">
                <p className="text-xs text-neutral-400">Gastado ARS</p>
                <p className="mt-0.5 text-base font-bold text-red-400">{fmtARS(arsGastado)}</p>
              </div>
              <div className="rounded-xl bg-neutral-800 px-4 py-3">
                <p className="text-xs text-neutral-400">Presupuestado ARS</p>
                <p className="mt-0.5 text-base font-bold text-white">{fmtARS(arsPresupuestado)}</p>
              </div>
              <div className={`rounded-xl px-4 py-3 ${arsGastado <= arsPresupuestado ? "bg-green-950" : "bg-red-950"}`}>
                <p className="text-xs text-neutral-400">Disponible ARS</p>
                <p className={`mt-0.5 text-base font-bold ${arsGastado <= arsPresupuestado ? "text-green-400" : "text-red-400"}`}>
                  {fmtARS(arsPresupuestado - arsGastado)}
                </p>
              </div>
            </>
          )}
          {usdPresupuestado > 0 && (
            <>
              <div className="rounded-xl bg-neutral-800 px-4 py-3">
                <p className="text-xs text-neutral-400">Gastado USD</p>
                <p className="mt-0.5 text-base font-bold text-red-400">{fmtUSD(usdGastado)}</p>
              </div>
              <div className="rounded-xl bg-neutral-800 px-4 py-3">
                <p className="text-xs text-neutral-400">Suscripciones USD/mes</p>
                <p className="mt-0.5 text-base font-bold text-white">{fmtUSD(usdPresupuestado)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">
        <BudgetManager
          budgets={budgets.map((b) => ({ id: b.id, category: b.category, monthlyLimit: b.monthlyLimit, currency: b.currency }))}
          gastoPorCategoria={gastoPorCategoria}
          gastoPorCategoriaUSD={gastoPorCategoriaUSD}
          categorias={todasLasCats}
        />
      </div>
    </div>
  );
}
