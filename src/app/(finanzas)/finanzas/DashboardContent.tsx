"use client";

import { useCurrency } from "@/context/CurrencyContext";
import MonthlyChart, { type MonthlyDataPoint } from "@/components/finanzas/MonthlyChart";
import CategoryChart from "@/components/finanzas/CategoryChart";
import WealthChart, { type WealthDataPoint } from "@/components/finanzas/WealthChart";
import Link from "next/link";
import {
  LuTrendingDown,
  LuTrendingUp,
  LuArrowUp,
  LuArrowDown,
  LuTriangleAlert,
  LuCalendar,
  LuRepeat,
  LuWallet,
} from "react-icons/lu";

interface BudgetAlert {
  category: string;
  spent: number;
  limit: number;
  pct: number;
}

interface SessionToday {
  clientName: string;
  time: string;
  type: string;
}

interface RecurringToday {
  description: string;
  amount: number;
  currency: string;
  transactionType: string;
}

interface RecentTransaction {
  id: string;
  description: string | null;
  category: string;
  date: string;
  amount: number;
  currency: string;
  type: string;
}

interface Props {
  // Patrimonio
  totalARS: number;
  walletsARSCount: number;
  foreignUSD: number;
  foreignAccountsCount: number;
  portfolioUSD: number;
  walletsUSD: number;
  investmentsCount: number;
  portfolioDayChange: number;
  // Mes
  ingresosMes: number;
  gastosMes: number;
  balanceMes: number;
  tasaAhorro: number | null;
  diffGastos: number | null;
  diffIngresos: number | null;
  mesLabel: string;
  // Charts
  categoryData: { category: string; total: number }[];
  monthlyData: MonthlyDataPoint[];
  wealthData: WealthDataPoint[];
  // Últimas transacciones
  recentTransactions: RecentTransaction[];
  // Alertas "Hoy"
  budgetAlerts: BudgetAlert[];
  sessionsToday: SessionToday[];
  recurringToday: RecurringToday[];
}

function Diff({ pct, inverse = false }: { pct: number | null; inverse?: boolean }) {
  if (pct === null) return null;
  const isGood = inverse ? pct <= 0 : pct >= 0;
  return (
    <p className={`mt-1 flex items-center gap-0.5 text-xs ${isGood ? "text-green-500" : "text-red-500"}`}>
      {pct >= 0 ? <LuArrowUp size={10} /> : <LuArrowDown size={10} />}
      {pct >= 0 ? "+" : ""}{pct.toFixed(0)}% vs mes anterior
    </p>
  );
}

export default function DashboardContent({
  totalARS,
  walletsARSCount,
  foreignUSD,
  foreignAccountsCount,
  portfolioUSD,
  walletsUSD,
  investmentsCount,
  portfolioDayChange,
  ingresosMes,
  gastosMes,
  balanceMes,
  tasaAhorro,
  diffGastos,
  diffIngresos,
  mesLabel,
  categoryData,
  monthlyData,
  wealthData,
  recentTransactions,
  budgetAlerts,
  sessionsToday,
  recurringToday,
}: Props) {
  const { currency, fmt, convert, usdArs } = useCurrency();

  // Patrimonio unificado en la moneda seleccionada
  const totalUSD = walletsUSD + foreignUSD + portfolioUSD;
  const patrimonioUnificado =
    currency === "ARS"
      ? totalARS + totalUSD * usdArs
      : totalARS / usdArs + totalUSD;

  const fmtAmt = (amount: number, cur: "ARS" | "USD") => fmt(amount, cur);

  const todayAlerts = [
    ...budgetAlerts.map((a) => ({
      icon: <LuTriangleAlert size={13} className="text-orange-400" />,
      text: `Presupuesto ${a.category}: ${a.pct.toFixed(0)}% usado`,
      sub: `${fmtAmt(a.spent, "ARS")} de ${fmtAmt(a.limit, "ARS")}`,
      color: a.pct >= 100 ? "ring-red-800/30 bg-red-950/20" : "ring-orange-800/30 bg-orange-950/20",
    })),
    ...sessionsToday.map((s) => ({
      icon: <LuCalendar size={13} className="text-blue-400" />,
      text: `Sesión hoy — ${s.clientName}`,
      sub: `${s.time} · ${s.type}`,
      color: "ring-blue-800/30 bg-blue-950/20",
    })),
    ...recurringToday.map((r) => ({
      icon: <LuRepeat size={13} className="text-neutral-400" />,
      text: r.description,
      sub: `${r.transactionType === "EXPENSE" ? "-" : "+"}${fmtAmt(r.amount, r.currency as "ARS" | "USD")} recurrente`,
      color: "ring-neutral-700/40 bg-neutral-800/20",
    })),
  ];

  return (
    <div className="space-y-6">
      {/* ── Hero: Patrimonio total ───────────────────────────────────────────── */}
      <section>
        <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-neutral-900 to-neutral-900 p-6 ring-1 ring-blue-900/40">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
                Patrimonio total · {currency}
              </p>
              <p className="mt-2 text-4xl font-bold text-white tracking-tight">
                {currency === "ARS"
                  ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(patrimonioUnificado)
                  : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(patrimonioUnificado)}
              </p>
              {portfolioDayChange !== 0 && (
                <p className={`mt-1 flex items-center gap-1 text-sm font-medium ${portfolioDayChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {portfolioDayChange >= 0 ? <LuArrowUp size={13} /> : <LuArrowDown size={13} />}
                  {portfolioDayChange >= 0 ? "+" : ""}{fmt(portfolioDayChange, "USD")} portfolio hoy
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 text-sm mt-3 sm:mt-0 sm:text-right">
              <p className="text-neutral-400">
                <span className="text-neutral-500 text-xs">ARS </span>
                {fmtAmt(totalARS, "ARS")}
                <span className="ml-1 text-neutral-600 text-xs">({walletsARSCount} billeteras)</span>
              </p>
              <p className="text-neutral-400">
                <span className="text-neutral-500 text-xs">Foráneo </span>
                {fmtAmt(foreignUSD, "USD")}
                <span className="ml-1 text-neutral-600 text-xs">({foreignAccountsCount} cuentas)</span>
              </p>
              <p className="text-neutral-400">
                <span className="text-neutral-500 text-xs">Portfolio </span>
                {fmtAmt(portfolioUSD, "USD")}
                <span className="ml-1 text-neutral-600 text-xs">({investmentsCount} activos)</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Strip: Hoy ──────────────────────────────────────────────────────── */}
      {todayAlerts.length > 0 && (
        <section>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Hoy</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {todayAlerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 ring-1 ${a.color}`}>
                <span className="mt-0.5 flex-shrink-0">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{a.text}</p>
                  <p className="text-xs text-neutral-500 truncate">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Mes actual ───────────────────────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500 capitalize">{mesLabel}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">Ingresos</p>
            <p className="mt-1.5 text-xl font-bold text-green-400">{fmtAmt(ingresosMes, "ARS")}</p>
            <Diff pct={diffIngresos} />
          </div>
          <div className="rounded-xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">Gastos</p>
            <p className="mt-1.5 text-xl font-bold text-red-400">{fmtAmt(gastosMes, "ARS")}</p>
            <Diff pct={diffGastos} inverse />
          </div>
          <div className={`rounded-xl p-4 ${balanceMes >= 0 ? "bg-green-950 ring-1 ring-green-900/50" : "bg-red-950 ring-1 ring-red-900/50"}`}>
            <p className="text-xs text-neutral-400">Balance</p>
            <p className={`mt-1.5 text-xl font-bold ${balanceMes >= 0 ? "text-green-400" : "text-red-400"}`}>
              {balanceMes >= 0 ? "+" : ""}{fmtAmt(balanceMes, "ARS")}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              {balanceMes >= 0 ? "Ahorrás este mes" : "Déficit este mes"}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">Tasa de ahorro</p>
            {tasaAhorro !== null ? (
              <>
                <p className={`mt-1.5 text-xl font-bold ${tasaAhorro >= 20 ? "text-green-400" : tasaAhorro >= 0 ? "text-yellow-400" : "text-red-400"}`}>
                  {tasaAhorro.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  {tasaAhorro >= 20 ? "Excelente" : tasaAhorro >= 10 ? "Aceptable" : tasaAhorro >= 0 ? "Bajo" : "En rojo"}
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-xl font-bold text-neutral-600">—</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Gráficos ─────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {categoryData.length > 0 && (
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="mb-1 text-sm font-medium text-white">Gastos por categoría</p>
            <p className="mb-5 text-xs text-neutral-500 capitalize">{mesLabel}</p>
            <CategoryChart data={categoryData} />
          </div>
        )}
        {monthlyData.some((m) => m.ingresos > 0 || m.gastos > 0) && (
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="mb-1 text-sm font-medium text-white">Ingresos vs Gastos</p>
            <p className="mb-5 text-xs text-neutral-500">Últimos 6 meses · ARS</p>
            <MonthlyChart data={monthlyData} />
          </div>
        )}
      </section>

      {/* ── Evolución patrimonio ─────────────────────────────────────────────── */}
      {wealthData.length >= 2 && (
        <section>
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="mb-1 text-sm font-medium text-white">Evolución del patrimonio</p>
            <p className="mb-5 text-xs text-neutral-500">Snapshots mensuales</p>
            <WealthChart data={wealthData} />
          </div>
        </section>
      )}

      {/* ── Últimas transacciones ─────────────────────────────────────────────── */}
      {recentTransactions.length > 0 && (
        <section>
          <div className="rounded-xl bg-neutral-800 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Últimas transacciones</p>
              <Link href="/finanzas/transacciones" className="text-xs text-neutral-500 hover:text-neutral-300">
                Ver todas →
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-neutral-700">
              {recentTransactions.map((t) => {
                const isExpense = t.type === "EXPENSE" || t.type === "STOCK_PURCHASE" || t.type === "CRYPTO_PURCHASE";
                return (
                  <div key={t.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex-shrink-0 ${isExpense ? "text-red-400" : "text-green-400"}`}>
                        {isExpense ? <LuTrendingDown size={15} /> : <LuTrendingUp size={15} />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{t.description ?? t.category}</p>
                        <p className="text-xs text-neutral-500">
                          {t.category} ·{" "}
                          {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(new Date(t.date))}
                        </p>
                      </div>
                    </div>
                    <p className={`flex-shrink-0 ml-3 text-sm font-semibold ${isExpense ? "text-red-400" : "text-green-400"}`}>
                      {isExpense ? "-" : "+"}{fmtAmt(t.amount, t.currency as "ARS" | "USD")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
