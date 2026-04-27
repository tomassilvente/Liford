export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import { fetchCotizaciones } from "@/lib/cotizaciones";
import type { MonthlyDataPoint } from "@/components/finanzas/MonthlyChart";
import type { WealthDataPoint } from "@/components/finanzas/WealthChart";
import DashboardContent from "./DashboardContent";

export default async function FinanzasDashboard() {
  const session = await requireSession();
  const userId = session.userId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [
    wallets,
    foreignAccounts,
    investments,
    allTransactions,
    recentTransactions,
    wealthSnapshots,
    budgets,
    sessionsToday,
    recurringItems,
  ] = await Promise.all([
    db.wallet.findMany({ where: { userId } }),
    db.foreignAccount.findMany({ where: { userId } }),
    db.investment.findMany({ where: { userId } }),
    db.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      orderBy: { date: "asc" },
    }),
    db.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 8,
    }),
    db.wealthSnapshot.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 12,
    }),
    db.budget.findMany({ where: { userId } }),
    db.session.findMany({
      where: {
        client: { userId },
        date: { gte: startOfToday, lt: endOfToday },
      },
      include: { client: { select: { name: true } } },
    }),
    db.recurringExpense.findMany({
      where: { userId, isActive: true, dayOfMonth: now.getDate() },
    }),
  ]);

  // ── Portfolio ──────────────────────────────────────────────────────────────
  const tickers = investments.map((i) => i.ticker);
  const cotizaciones = tickers.length > 0 ? await fetchCotizaciones(tickers) : {};

  const portfolioUSD = investments.reduce((sum, inv) => {
    const price = cotizaciones[inv.ticker]?.price ?? inv.avgBuyPrice;
    return sum + inv.quantity * price;
  }, 0);

  const portfolioDayChange = investments.reduce((sum, inv) => {
    const c = cotizaciones[inv.ticker];
    if (!c?.changeAmount) return sum;
    return sum + c.changeAmount * inv.quantity;
  }, 0);

  // ── Billeteras ─────────────────────────────────────────────────────────────
  const totalARS = wallets.filter((w) => w.currency === "ARS").reduce((s, w) => s + w.balance, 0);
  const walletsUSD = wallets.filter((w) => w.currency === "USD").reduce((s, w) => s + w.balance, 0);
  const foreignUSD = foreignAccounts.reduce((s, a) => s + a.balance, 0);

  // ── Mes actual ─────────────────────────────────────────────────────────────
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

  // ── Categorías ─────────────────────────────────────────────────────────────
  const categoryMap: Record<string, number> = {};
  for (const t of thisMes) {
    if (t.type !== TransactionType.EXPENSE || t.currency !== "ARS") continue;
    categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount;
  }
  const categoryData = Object.entries(categoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── Gráfico mensual ────────────────────────────────────────────────────────
  const monthlyMap: Record<string, MonthlyDataPoint> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { month: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }), ingresos: 0, gastos: 0 };
  }
  for (const t of allTransactions) {
    if (t.currency !== "ARS") continue;
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) continue;
    if (t.type === TransactionType.INCOME) monthlyMap[key].ingresos += t.amount;
    if (t.type === TransactionType.EXPENSE) monthlyMap[key].gastos += t.amount;
  }

  // ── Patrimonio chart ───────────────────────────────────────────────────────
  const wealthData: WealthDataPoint[] = wealthSnapshots.map((s) => ({
    month: s.date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
    totalARS: s.totalARS,
    totalUSD: s.totalUSD,
  }));

  // ── Alertas de presupuesto ─────────────────────────────────────────────────
  const gastoPorCat: Record<string, number> = {};
  for (const t of thisMes) {
    if (t.type === TransactionType.EXPENSE && t.source === TransactionSource.PERSONAL && t.currency === "ARS") {
      gastoPorCat[t.category] = (gastoPorCat[t.category] ?? 0) + t.amount;
    }
  }
  const budgetAlerts = budgets
    .filter((b) => b.currency === "ARS")
    .map((b) => {
      const spent = gastoPorCat[b.category] ?? 0;
      const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      return { category: b.category, spent, limit: b.monthlyLimit, pct };
    })
    .filter((a) => a.pct >= 90)
    .sort((a, b) => b.pct - a.pct);

  // ── Sesiones hoy ───────────────────────────────────────────────────────────
  const sessionsTodayData = sessionsToday.map((s) => ({
    clientName: s.client.name,
    time: s.date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    type: s.type,
  }));

  // ── Recurrentes hoy ────────────────────────────────────────────────────────
  const recurringTodayData = recurringItems.map((r) => ({
    description: r.description,
    amount: r.amount,
    currency: r.currency,
    transactionType: r.transactionType,
  }));

  return (
    <DashboardContent
      totalARS={totalARS}
      walletsARSCount={wallets.filter((w) => w.currency === "ARS").length}
      foreignUSD={foreignUSD}
      foreignAccountsCount={foreignAccounts.length}
      portfolioUSD={portfolioUSD}
      walletsUSD={walletsUSD}
      investmentsCount={investments.length}
      portfolioDayChange={portfolioDayChange}
      ingresosMes={ingresosMes}
      gastosMes={gastosMes}
      balanceMes={balanceMes}
      tasaAhorro={tasaAhorro}
      diffGastos={diffGastos}
      diffIngresos={diffIngresos}
      mesLabel={now.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
      categoryData={categoryData}
      monthlyData={Object.values(monthlyMap)}
      wealthData={wealthData}
      recentTransactions={recentTransactions.map((t) => ({
        id: t.id,
        description: t.description,
        category: t.category,
        date: t.date.toISOString(),
        amount: t.amount,
        currency: t.currency,
        type: t.type,
      }))}
      budgetAlerts={budgetAlerts}
      sessionsToday={sessionsTodayData}
      recurringToday={recurringTodayData}
    />
  );
}
