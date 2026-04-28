"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import YearChart, { type YearDataPoint } from "@/components/finanzas/YearChart";
import { LuTrendingUp, LuTrendingDown, LuMinus } from "react-icons/lu";

interface Props {
  year: number;
  displayCurrency: "ARS" | "USD";
  monthlyData: YearDataPoint[];
  totalIngresos: number;
  totalGastos: number;
  totalBalance: number;
  diffIngresos: number | null;
  diffGastos: number | null;
  topCats: { category: string; total: number }[];
  usdArs: number;
  availableYears: number[];
}

function fmt(n: number, currency: "ARS" | "USD"): string {
  return currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
    : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function Diff({ pct, inverse = false }: { pct: number | null; inverse?: boolean }) {
  if (pct === null) return <span className="text-neutral-600 text-xs">—</span>;
  const good = inverse ? pct < 0 : pct > 0;
  const color = pct === 0 ? "text-neutral-500" : good ? "text-green-400" : "text-red-400";
  const Icon = pct > 0 ? LuTrendingUp : pct < 0 ? LuTrendingDown : LuMinus;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon size={11} />
      {pct > 0 ? "+" : ""}{pct.toFixed(1)}% vs año ant.
    </span>
  );
}

export default function AnualContent({
  year, displayCurrency, monthlyData, totalIngresos, totalGastos, totalBalance,
  diffIngresos, diffGastos, topCats, usdArs, availableYears,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(params: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) p.set(k, v);
    router.push(`${pathname}?${p.toString()}`);
  }

  const maxGasto = Math.max(...topCats.map((c) => c.total), 1);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Vista anual</h1>
          <p className="mt-1 text-sm text-neutral-400">Resumen completo del año — gastos vs ingresos mes a mes</p>
        </div>
        <div className="flex gap-2">
          {/* Selector de año */}
          <select
            value={year}
            onChange={(e) => navigate({ anio: e.target.value })}
            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700"
          >
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* Toggle moneda */}
          <div className="flex rounded-lg bg-neutral-800 p-0.5 ring-1 ring-neutral-700">
            {(["ARS", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => navigate({ moneda: c })}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${displayCurrency === c ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {displayCurrency === "USD" && (
        <p className="mb-4 text-xs text-neutral-600">Cotización usada: 1 USD = {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(usdArs)}</p>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-neutral-800 p-4">
          <p className="text-xs text-neutral-400">Ingresos {year}</p>
          <p className="mt-1 text-2xl font-bold text-green-400 tabular-nums">{fmt(totalIngresos, displayCurrency)}</p>
          <Diff pct={diffIngresos} />
        </div>
        <div className="rounded-xl bg-neutral-800 p-4">
          <p className="text-xs text-neutral-400">Gastos {year}</p>
          <p className="mt-1 text-2xl font-bold text-red-400 tabular-nums">{fmt(totalGastos, displayCurrency)}</p>
          <Diff pct={diffGastos} inverse />
        </div>
        <div className={`rounded-xl p-4 ${totalBalance >= 0 ? "bg-green-950/30 ring-1 ring-green-900/30" : "bg-red-950/30 ring-1 ring-red-900/30"}`}>
          <p className="text-xs text-neutral-400">Balance {year}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${totalBalance >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(totalBalance, displayCurrency)}</p>
          <p className="text-xs text-neutral-600">
            Tasa de ahorro: {totalIngresos > 0 ? `${((totalBalance / totalIngresos) * 100).toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Gráfico mensual */}
      <div className="mb-6 rounded-xl bg-neutral-800 p-5">
        <p className="mb-4 text-sm font-semibold text-neutral-300">Gastos vs Ingresos — mes a mes</p>
        <YearChart data={monthlyData} currency={displayCurrency} />
      </div>

      {/* Top categorías */}
      {topCats.length > 0 && (
        <div className="rounded-xl bg-neutral-800 p-5">
          <p className="mb-4 text-sm font-semibold text-neutral-300">Top gastos por categoría</p>
          <div className="space-y-3">
            {topCats.map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-neutral-300">{c.category}</span>
                  <span className="tabular-nums font-medium text-neutral-400">{fmt(c.total, displayCurrency)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-700">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(c.total / maxGasto) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
