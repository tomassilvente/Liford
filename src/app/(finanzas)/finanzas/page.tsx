export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { TransactionType } from "@/generated/prisma/enums";
import { fetchCotizaciones } from "@/lib/cotizaciones";
import MonthlyChart, { type MonthlyDataPoint } from "@/components/finanzas/MonthlyChart";
import CategoryChart from "@/components/finanzas/CategoryChart";
import Link from "next/link";

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}
function fmtDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(new Date(date));
}

export default async function FinanzasDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [wallets, foreignAccounts, investments, allTransactions, recentTransactions] =
    await Promise.all([
      db.wallet.findMany(),
      db.foreignAccount.findMany(),
      db.investment.findMany(),
      db.transaction.findMany({
        where: { date: { gte: sixMonthsAgo } },
        orderBy: { date: "asc" },
      }),
      db.transaction.findMany({ orderBy: { date: "desc" }, take: 8 }),
    ]);

  // ── Portfolio ──────────────────────────────────────────────────────────────
  const tickers = investments.map((i) => i.ticker);
  const cotizaciones = tickers.length > 0 ? await fetchCotizaciones(tickers) : {};

  const portfolioUSD = investments.reduce((sum, inv) => {
    const price = cotizaciones[inv.ticker]?.price ?? inv.avgBuyPrice;
    return sum + inv.quantity * price;
  }, 0);

  // Variación del portfolio hoy en USD
  const portfolioDayChange = investments.reduce((sum, inv) => {
    const c = cotizaciones[inv.ticker];
    if (!c?.changeAmount) return sum;
    return sum + c.changeAmount * inv.quantity;
  }, 0);

  // ── Billeteras ─────────────────────────────────────────────────────────────
  const totalARS = wallets.filter((w) => w.currency === "ARS").reduce((s, w) => s + w.balance, 0);
  const walletsUSD = wallets.filter((w) => w.currency === "USD").reduce((s, w) => s + w.balance, 0);
  const foreignUSD = foreignAccounts.reduce((s, a) => s + a.balance, 0);
  const totalUSD = walletsUSD + portfolioUSD + foreignUSD;

  // ── Mes actual ────────────────────────────────────────────────────────────
  const thisMes = allTransactions.filter((t) => t.date >= startOfMonth && t.date < endOfMonth);
  const lastMes = allTransactions.filter((t) => t.date >= startOfLastMonth && t.date < startOfMonth);

  const ingresosMes = thisMes.filter((t) => t.type === TransactionType.INCOME && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
  const gastosMes = thisMes.filter((t) => t.type === TransactionType.EXPENSE && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
  const balanceMes = ingresosMes - gastosMes;
  const tasaAhorro = ingresosMes > 0 ? ((ingresosMes - gastosMes) / ingresosMes) * 100 : null;

  const gastosLastMes = lastMes.filter((t) => t.type === TransactionType.EXPENSE && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
  const ingresosLastMes = lastMes.filter((t) => t.type === TransactionType.INCOME && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);

  const diffGastos = gastosLastMes > 0 ? ((gastosMes - gastosLastMes) / gastosLastMes) * 100 : null;
  const diffIngresos = ingresosLastMes > 0 ? ((ingresosMes - ingresosLastMes) / ingresosLastMes) * 100 : null;

  // ── Categorías de gasto del mes ───────────────────────────────────────────
  const categoryMap: Record<string, number> = {};
  for (const t of thisMes) {
    if (t.type !== TransactionType.EXPENSE || t.currency !== "ARS") continue;
    categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount;
  }
  const categoryData = Object.entries(categoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── Gráfico mensual ───────────────────────────────────────────────────────
  const monthlyMap: Record<string, MonthlyDataPoint> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
    monthlyMap[key] = { month: label, ingresos: 0, gastos: 0 };
  }
  for (const t of allTransactions) {
    if (t.currency !== "ARS") continue;
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) continue;
    if (t.type === TransactionType.INCOME) monthlyMap[key].ingresos += t.amount;
    if (t.type === TransactionType.EXPENSE) monthlyMap[key].gastos += t.amount;
  }
  const monthlyData = Object.values(monthlyMap);

  const mesLabel = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-neutral-400 capitalize">
          {now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Patrimonio ── */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Patrimonio</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-xs text-neutral-400">Billeteras ARS</p>
            <p className="mt-2 text-xl font-bold text-white">{fmtARS(totalARS)}</p>
            <Link href="/finanzas/billeteras" className="mt-1 block text-xs text-neutral-600 hover:text-neutral-400">
              {wallets.filter((w) => w.currency === "ARS").length} billeteras →
            </Link>
          </div>
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-xs text-neutral-400">Billeteras USD</p>
            <p className="mt-2 text-xl font-bold text-white">{fmtUSD(walletsUSD)}</p>
            <Link href="/finanzas/billeteras" className="mt-1 block text-xs text-neutral-600 hover:text-neutral-400">
              {wallets.filter((w) => w.currency === "USD").length} billeteras →
            </Link>
          </div>
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-xs text-neutral-400">Portfolio</p>
            <p className="mt-2 text-xl font-bold text-white">{fmtUSD(portfolioUSD)}</p>
            {portfolioDayChange !== 0 && (
              <p className={`mt-1 text-xs font-medium ${portfolioDayChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {portfolioDayChange >= 0 ? "▲ +" : "▼ "}{fmtUSD(portfolioDayChange)} hoy
              </p>
            )}
            <Link href="/finanzas/inversiones" className="mt-1 block text-xs text-neutral-600 hover:text-neutral-400">
              {investments.length} activos →
            </Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-900 to-neutral-800 p-5 ring-1 ring-blue-800">
            <p className="text-xs text-blue-300">Total USD</p>
            <p className="mt-2 text-xl font-bold text-white">{fmtUSD(totalUSD)}</p>
            <p className="mt-1 text-xs text-blue-400">
              Billeteras + Portfolio{foreignUSD > 0 ? " + Foráneas" : ""}
            </p>
          </div>
        </div>
      </section>

      {/* ── Mes actual ── */}
      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500 capitalize">{mesLabel}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-xs text-neutral-400">Ingresos</p>
            <p className="mt-2 text-xl font-bold text-green-400">{fmtARS(ingresosMes)}</p>
            {diffIngresos !== null && (
              <p className={`mt-1 text-xs ${diffIngresos >= 0 ? "text-green-600" : "text-red-600"}`}>
                {diffIngresos >= 0 ? "+" : ""}{diffIngresos.toFixed(0)}% vs mes anterior
              </p>
            )}
          </div>
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-xs text-neutral-400">Gastos</p>
            <p className="mt-2 text-xl font-bold text-red-400">{fmtARS(gastosMes)}</p>
            {diffGastos !== null && (
              <p className={`mt-1 text-xs ${diffGastos <= 0 ? "text-green-600" : "text-red-600"}`}>
                {diffGastos >= 0 ? "+" : ""}{diffGastos.toFixed(0)}% vs mes anterior
              </p>
            )}
          </div>
          <div className={`rounded-xl p-5 ${balanceMes >= 0 ? "bg-green-950 ring-1 ring-green-900" : "bg-red-950 ring-1 ring-red-900"}`}>
            <p className="text-xs text-neutral-400">Balance</p>
            <p className={`mt-2 text-xl font-bold ${balanceMes >= 0 ? "text-green-400" : "text-red-400"}`}>
              {balanceMes >= 0 ? "+" : ""}{fmtARS(balanceMes)}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              {balanceMes >= 0 ? "Ahorrás este mes" : "Déficit este mes"}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-xs text-neutral-400">Tasa de ahorro</p>
            {tasaAhorro !== null ? (
              <>
                <p className={`mt-2 text-xl font-bold ${tasaAhorro >= 20 ? "text-green-400" : tasaAhorro >= 0 ? "text-yellow-400" : "text-red-400"}`}>
                  {tasaAhorro.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  {tasaAhorro >= 20 ? "Excelente" : tasaAhorro >= 10 ? "Aceptable" : tasaAhorro >= 0 ? "Bajo" : "En rojo"}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xl font-bold text-neutral-600">—</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Fila: Categorías + Gráfico mensual ── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Gastos por categoría */}
        {categoryData.length > 0 && (
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="mb-1 text-sm font-medium text-white">Gastos por categoría</p>
            <p className="mb-5 text-xs text-neutral-500 capitalize">{mesLabel}</p>
            <CategoryChart data={categoryData} />
          </div>
        )}

        {/* Gráfico mensual */}
        {monthlyData.some((m) => m.ingresos > 0 || m.gastos > 0) && (
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="mb-1 text-sm font-medium text-white">Ingresos vs Gastos</p>
            <p className="mb-5 text-xs text-neutral-500">Últimos 6 meses en ARS</p>
            <MonthlyChart data={monthlyData} />
          </div>
        )}
      </section>

      {/* ── Últimas transacciones ── */}
      {recentTransactions.length > 0 && (
        <section>
          <div className="rounded-xl bg-neutral-800 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Últimas transacciones</p>
              <div className="flex gap-3">
                <Link href="/finanzas/gastos" className="text-xs text-neutral-500 hover:text-neutral-300">Gastos</Link>
                <Link href="/finanzas/ingresos" className="text-xs text-neutral-500 hover:text-neutral-300">Ingresos</Link>
              </div>
            </div>
            <div className="flex flex-col divide-y divide-neutral-700">
              {recentTransactions.map((t) => {
                const isExpense = t.type === TransactionType.EXPENSE;
                return (
                  <div key={t.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-base">{isExpense ? "📉" : "📈"}</span>
                      <div>
                        <p className="text-sm text-white">{t.description}</p>
                        <p className="text-xs text-neutral-500">{t.category} · {fmtDate(t.date)}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${isExpense ? "text-red-400" : "text-green-400"}`}>
                      {isExpense ? "-" : "+"}{t.currency === "ARS" ? fmtARS(t.amount) : fmtUSD(t.amount)}
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
