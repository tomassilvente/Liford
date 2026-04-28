"use client";

import { useCurrency } from "@/context/CurrencyContext";
import MonthlyChart, { type MonthlyDataPoint } from "@/components/finanzas/MonthlyChart";
import CategoryChart from "@/components/finanzas/CategoryChart";
import WealthChart, { type WealthDataPoint } from "@/components/finanzas/WealthChart";
import Link from "next/link";
import {
  LuTrendingDown, LuTrendingUp, LuArrowUp, LuArrowDown,
  LuTriangleAlert, LuCalendar, LuRepeat,
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
  displayName: string;
  totalARS: number;
  walletsARSCount: number;
  foreignUSD: number;
  foreignAccountsCount: number;
  portfolioUSD: number;
  walletsUSD: number;
  investmentsCount: number;
  portfolioDayChange: number;
  ingresosMes: number;
  gastosMes: number;
  balanceMes: number;
  tasaAhorro: number | null;
  diffGastos: number | null;
  diffIngresos: number | null;
  mesLabel: string;
  gastadoHoy: number;
  txHoyCount: number;
  presupuestoTotal: number;
  presupuestoRestante: number;
  presupuestoPct: number | null;
  diasRestantesMes: number;
  proximoRecurrente: { description: string; amount: number; currency: string; dayOfMonth: number } | null;
  categoryData: { category: string; total: number }[];
  monthlyData: MonthlyDataPoint[];
  wealthData: WealthDataPoint[];
  recentTransactions: RecentTransaction[];
  budgetAlerts: BudgetAlert[];
  sessionsToday: SessionToday[];
}

function Diff({ pct, inverse = false }: { pct: number | null; inverse?: boolean }) {
  if (pct === null) return null;
  const isGood = inverse ? pct <= 0 : pct >= 0;
  return (
    <p className={`mt-1 flex items-center gap-0.5 text-xs ${isGood ? "text-green-500" : "text-red-500"}`}>
      {pct >= 0 ? <LuArrowUp size={10} /> : <LuArrowDown size={10} />}
      {pct >= 0 ? "+" : ""}{pct.toFixed(0)}% vs mes ant.
    </p>
  );
}

function getHour() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function DashboardContent({
  displayName,
  totalARS, walletsARSCount, foreignUSD, foreignAccountsCount,
  portfolioUSD, walletsUSD, investmentsCount, portfolioDayChange,
  ingresosMes, gastosMes, balanceMes, tasaAhorro,
  diffGastos, diffIngresos, mesLabel,
  gastadoHoy, txHoyCount,
  presupuestoTotal, presupuestoRestante, presupuestoPct, diasRestantesMes,
  proximoRecurrente,
  categoryData, monthlyData, wealthData,
  recentTransactions, budgetAlerts, sessionsToday,
}: Props) {
  const { currency, fmt, usdArs } = useCurrency();

  const totalUSD = walletsUSD + foreignUSD + portfolioUSD;
  const patrimonioUnificado =
    currency === "ARS"
      ? totalARS + totalUSD * usdArs
      : totalARS / usdArs + totalUSD;

  const fmtARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  const fmtUSD_ = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const patrimonioFmt = currency === "ARS" ? fmtARS(patrimonioUnificado) : fmtUSD_(patrimonioUnificado);

  // Dias del mes para "Queda del mes"
  const quedaPct = presupuestoTotal > 0 ? (presupuestoRestante / presupuestoTotal) * 100 : null;

  return (
    <div className="space-y-6">

      {/* ── Greeting ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-neutral-400">
          {getHour()},{" "}
          <span className="text-white font-semibold capitalize">{displayName}</span>
        </h2>
      </div>

      {/* ── Hero: Patrimonio total ─────────────────────────────────────────────── */}
      <section>
        <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-neutral-900 to-neutral-900 p-6 ring-1 ring-blue-900/40">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400 mb-2">
            Patrimonio total · {currency}
          </p>
          <p className="text-4xl font-bold text-white tracking-tight tabular-nums">
            {patrimonioFmt}
          </p>
          {portfolioDayChange !== 0 && (
            <p className={`mt-1.5 flex items-center gap-1 text-sm font-medium ${portfolioDayChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {portfolioDayChange >= 0 ? <LuArrowUp size={13} /> : <LuArrowDown size={13} />}
              {portfolioDayChange >= 0 ? "+" : ""}{fmt(portfolioDayChange, "USD")} portfolio hoy
            </p>
          )}
          {/* Breakdown pills */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-400">
            <span>
              <span className="text-neutral-600 text-xs">Billeteras </span>
              <span className="tabular-nums">{fmtARS(totalARS)}</span>
              {walletsARSCount > 0 && <span className="ml-1 text-neutral-600 text-xs">({walletsARSCount})</span>}
            </span>
            <span>
              <span className="text-neutral-600 text-xs">Cuentas USD </span>
              <span className="tabular-nums">{fmtUSD_(foreignUSD)}</span>
              {foreignAccountsCount > 0 && <span className="ml-1 text-neutral-600 text-xs">({foreignAccountsCount})</span>}
            </span>
            <span>
              <span className="text-neutral-600 text-xs">Portfolio </span>
              <span className="tabular-nums">{fmtUSD_(portfolioUSD)}</span>
              {investmentsCount > 0 && <span className="ml-1 text-neutral-600 text-xs">({investmentsCount})</span>}
            </span>
          </div>
        </div>
      </section>

      {/* ── Strip: Hoy — 3 KPIs fijos ─────────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Hoy</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

          {/* Gastado hoy */}
          <div className="rounded-xl bg-neutral-800 px-4 py-4">
            <p className="text-xs text-neutral-500 mb-1">Gastado hoy</p>
            <p className="text-xl font-bold text-white tabular-nums">
              {gastadoHoy > 0 ? fmtARS(gastadoHoy) : "—"}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              {txHoyCount > 0 ? `${txHoyCount} transacción${txHoyCount !== 1 ? "es" : ""}` : "Sin movimientos"}
            </p>
          </div>

          {/* Queda del mes */}
          <div className={`rounded-xl px-4 py-4 ${quedaPct !== null && quedaPct < 20 ? "bg-red-950/40 ring-1 ring-red-900/30" : "bg-neutral-800"}`}>
            <p className="text-xs text-neutral-500 mb-1">Queda del mes</p>
            {presupuestoTotal > 0 ? (
              <>
                <p className={`text-xl font-bold tabular-nums ${quedaPct !== null && quedaPct < 20 ? "text-red-400" : "text-white"}`}>
                  {fmtARS(presupuestoRestante)}
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  {diasRestantesMes}d restantes · {presupuestoPct !== null ? `${presupuestoPct.toFixed(0)}% usado` : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-neutral-600">—</p>
                <Link href="/finanzas/presupuesto" className="mt-1 block text-xs text-blue-500 hover:text-blue-400">
                  Configurar presupuesto →
                </Link>
              </>
            )}
          </div>

          {/* Próximo recurrente / Sesión hoy */}
          {sessionsToday.length > 0 ? (
            <div className="rounded-xl bg-blue-950/30 px-4 py-4 ring-1 ring-blue-900/30">
              <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1.5">
                <LuCalendar size={11} /> Sesión hoy
              </p>
              <p className="text-sm font-bold text-white truncate">{sessionsToday[0].clientName}</p>
              <p className="mt-1 text-xs text-neutral-500">{sessionsToday[0].time}</p>
            </div>
          ) : proximoRecurrente ? (
            <div className="rounded-xl bg-neutral-800 px-4 py-4">
              <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1.5">
                <LuRepeat size={11} />
                {proximoRecurrente.dayOfMonth === new Date().getDate() ? "Vence hoy" :
                 proximoRecurrente.dayOfMonth === new Date().getDate() + 1 ? "Vence mañana" :
                 `Vence el día ${proximoRecurrente.dayOfMonth}`}
              </p>
              <p className="text-sm font-bold text-white truncate">{proximoRecurrente.description}</p>
              <p className="mt-1 text-xs text-neutral-600 tabular-nums">
                {proximoRecurrente.currency === "USD"
                  ? fmtUSD_(proximoRecurrente.amount)
                  : fmtARS(proximoRecurrente.amount)}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-neutral-800/50 px-4 py-4">
              <p className="text-xs text-neutral-600 mb-1">Sin eventos pendientes</p>
              <p className="text-sm text-neutral-700">Todo al día ✓</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Presupuesto del mes (strip) ───────────────────────────────────────── */}
      {presupuestoPct !== null && (
        <section>
          <div className="rounded-xl bg-neutral-800 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white capitalize">Presupuesto · {mesLabel}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {fmtARS(gastosMes)} gastado de {fmtARS(presupuestoTotal)} ·{" "}
                  <span className={presupuestoPct > 90 ? "text-red-400" : presupuestoPct > 70 ? "text-yellow-400" : "text-green-400"}>
                    {presupuestoPct > 100 ? "Excedido" : presupuestoPct <= 50 && diasRestantesMes > 10 ? "Vas adelantado" : `${(100 - presupuestoPct).toFixed(0)}% restante para fin de mes`}
                  </span>
                </p>
              </div>
              <Link href="/finanzas/presupuesto" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex-shrink-0">
                Detalle →
              </Link>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-700">
              <div
                className={`h-full rounded-full transition-all ${presupuestoPct > 100 ? "bg-red-500" : presupuestoPct > 80 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(presupuestoPct, 100)}%` }}
              />
            </div>
            {/* Alertas de categorías >90% */}
            {budgetAlerts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {budgetAlerts.map((a) => (
                  <span key={a.category} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ${a.pct >= 100 ? "bg-red-950/30 text-red-400 ring-red-800/30" : "bg-orange-950/30 text-orange-400 ring-orange-800/30"}`}>
                    <LuTriangleAlert size={10} />
                    {a.category} {a.pct.toFixed(0)}%
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Mes actual — KPIs ─────────────────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500 capitalize">{mesLabel}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">Ingresos</p>
            <p className="mt-1.5 text-xl font-bold text-green-400 tabular-nums">{fmtARS(ingresosMes)}</p>
            <Diff pct={diffIngresos} />
          </div>
          <div className="rounded-xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">Gastos</p>
            <p className="mt-1.5 text-xl font-bold text-red-400 tabular-nums">{fmtARS(gastosMes)}</p>
            <Diff pct={diffGastos} inverse />
          </div>
          <div className={`rounded-xl p-4 ${balanceMes >= 0 ? "bg-green-950 ring-1 ring-green-900/50" : "bg-red-950 ring-1 ring-red-900/50"}`}>
            <p className="text-xs text-neutral-400">Balance</p>
            <p className={`mt-1.5 text-xl font-bold tabular-nums ${balanceMes >= 0 ? "text-green-400" : "text-red-400"}`}>
              {balanceMes >= 0 ? "+" : ""}{fmtARS(balanceMes)}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              {balanceMes >= 0 ? "Ahorrás este mes" : "Déficit este mes"}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">Tasa de ahorro</p>
            {tasaAhorro !== null ? (
              <>
                <p className={`mt-1.5 text-xl font-bold tabular-nums ${tasaAhorro >= 20 ? "text-green-400" : tasaAhorro >= 0 ? "text-yellow-400" : "text-red-400"}`}>
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
              <Link href="/finanzas/transacciones" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
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
                          {t.category} · {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(new Date(t.date))}
                        </p>
                      </div>
                    </div>
                    <p className={`flex-shrink-0 ml-3 text-sm font-semibold tabular-nums ${isExpense ? "text-red-400" : "text-green-400"}`}>
                      {isExpense ? "-" : "+"}{t.currency === "USD" ? fmtUSD_(t.amount) : fmtARS(t.amount)}
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
