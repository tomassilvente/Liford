export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import { fetchCotizaciones } from "@/lib/cotizaciones";
import { getUserWallets, getUserForeignAccounts, getUserCategories } from "@/lib/queries";
import type { MonthlyDataPoint } from "@/components/finanzas/MonthlyChart";
import type { WealthDataPoint } from "@/components/finanzas/WealthChart";
import DashboardContent from "./DashboardContent";

function currentYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function FinanzasDashboard({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const session = await requireSession();
  const userId = session.userId;

  const { mes } = await searchParams;
  const ym = mes ?? currentYM();
  const [selYear, selMonth] = ym.split("-").map(Number);
  const isCurrentMonth = ym === currentYM();

  const now = new Date();
  const startOfMonth    = new Date(selYear, selMonth - 1, 1);
  const endOfMonth      = new Date(selYear, selMonth, 1);
  const startOfLastMonth = new Date(selYear, selMonth - 2, 1);
  const endOfLastMonth  = startOfMonth;
  const sixMonthsAgo    = new Date(selYear, selMonth - 6, 1);
  const startOfToday    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday      = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const sevenDaysAgo    = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Date ranges for the 6-month chart (index 0 = current month)
  const monthRanges = Array.from({ length: 6 }, (_, i) => ({
    start: new Date(selYear, selMonth - 1 - i, 1),
    end:   new Date(selYear, selMonth - i,     1),
  }));

  // Date ranges for the 4-week rolling average (week 1 = last week, week 4 = 4 weeks ago)
  const weekRanges = Array.from({ length: 4 }, (_, i) => ({
    start: new Date(now.getTime() - (i + 2) * 7 * 24 * 60 * 60 * 1000),
    end:   new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000),
  }));

  const [
    wallets, foreignAccounts, investments,
    recentTransactions, wealthSnapshots, budgets, sessionsToday, allRecurring,
    // ARS month totals: [expCur, incCur, expLast, incLast]
    arsMonthTotals,
    // USD month totals: [expCur, incCur]
    usdMonthTotals,
    // Today
    todayAgg, todayCount,
    // Week
    weekAgg,
    // Fixed (recurring) expenses this month
    fixedAgg,
    // Category breakdowns
    catExpARSPersonal, catExpARS, catExpUSD, catIncARS, catIncUSD,
    // Monthly chart: pairs [expense, income] × 6 months (flat array, length 12)
    monthlyRaw,
    // 30-day delta: [arsInc, arsExp, usdInc, usdExp]
    delta30d,
    // 4-week averages
    weeklyRaw,
    // Categories for detail panel
    rawCategories,
  ] = await Promise.all([
    getUserWallets(userId),
    getUserForeignAccounts(userId),
    db.investment.findMany({ where: { userId } }),
    db.transaction.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 8 }),
    db.wealthSnapshot.findMany({ where: { userId }, orderBy: { date: "asc" }, take: 12 }),
    db.budget.findMany({ where: { userId } }),
    db.session.findMany({
      where: { client: { userId }, date: { gte: startOfToday, lt: endOfToday } },
      include: { client: { select: { name: true } } },
    }),
    db.recurringExpense.findMany({ where: { userId, isActive: true }, orderBy: { dayOfMonth: "asc" } }),
    // ARS month aggregates
    Promise.all([
      db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: startOfMonth,     lt: endOfMonth     } }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { userId, type: TransactionType.INCOME,  currency: "ARS", date: { gte: startOfMonth,     lt: endOfMonth     } }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: startOfLastMonth, lt: endOfLastMonth } }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { userId, type: TransactionType.INCOME,  currency: "ARS", date: { gte: startOfLastMonth, lt: endOfLastMonth } }, _sum: { amount: true } }),
    ]),
    // USD month aggregates
    Promise.all([
      db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "USD", date: { gte: startOfMonth, lt: endOfMonth } }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { userId, type: TransactionType.INCOME,  currency: "USD", date: { gte: startOfMonth, lt: endOfMonth } }, _sum: { amount: true } }),
    ]),
    // Today
    db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: startOfToday, lt: endOfToday } }, _sum: { amount: true } }),
    db.transaction.count({ where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: startOfToday, lt: endOfToday } } }),
    // Week
    db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: sevenDaysAgo } }, _sum: { amount: true } }),
    // Fixed expenses (linked to a recurring rule)
    db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: startOfMonth, lt: endOfMonth }, recurrentRuleId: { not: null } }, _sum: { amount: true } }),
    // Category groupBys
    db.transaction.groupBy({ by: ["category"], where: { userId, type: TransactionType.EXPENSE, currency: "ARS", source: TransactionSource.PERSONAL, date: { gte: startOfMonth, lt: endOfMonth } }, _sum: { amount: true } }),
    db.transaction.groupBy({ by: ["category"], where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: startOfMonth, lt: endOfMonth } }, _sum: { amount: true } }),
    db.transaction.groupBy({ by: ["category"], where: { userId, type: TransactionType.EXPENSE, currency: "USD", date: { gte: startOfMonth, lt: endOfMonth } }, _sum: { amount: true } }),
    db.transaction.groupBy({ by: ["category"], where: { userId, type: TransactionType.INCOME,  currency: "ARS", date: { gte: startOfMonth, lt: endOfMonth } }, _sum: { amount: true } }),
    db.transaction.groupBy({ by: ["category"], where: { userId, type: TransactionType.INCOME,  currency: "USD", date: { gte: startOfMonth, lt: endOfMonth } }, _sum: { amount: true } }),
    // Monthly chart: 6 months × [expense, income]
    Promise.all(
      monthRanges.flatMap(({ start, end }) => [
        db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: start, lt: end } }, _sum: { amount: true } }),
        db.transaction.aggregate({ where: { userId, type: TransactionType.INCOME,  currency: "ARS", date: { gte: start, lt: end } }, _sum: { amount: true } }),
      ])
    ),
    // 30-day delta
    Promise.all([
      db.transaction.aggregate({ where: { userId, type: TransactionType.INCOME,  currency: "ARS", date: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { userId, type: TransactionType.INCOME,  currency: "USD", date: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "USD", date: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
    ]),
    // 4-week averages
    Promise.all(
      weekRanges.map(({ start, end }) =>
        db.transaction.aggregate({ where: { userId, type: TransactionType.EXPENSE, currency: "ARS", date: { gte: start, lt: end } }, _sum: { amount: true } })
      )
    ),
    // Categories (cached — no extra DB hit)
    getUserCategories(userId),
  ]);

  // ── Portfolio ──────────────────────────────────────────────────────────────
  const tickers = investments.map((i) => i.ticker);
  const cotizaciones = tickers.length > 0 ? await fetchCotizaciones(tickers) : {};
  const portfolioUSD = investments.reduce((sum, inv) => sum + inv.quantity * (cotizaciones[inv.ticker]?.price ?? inv.avgBuyPrice), 0);
  const portfolioDayChange = investments.reduce((sum, inv) => {
    const c = cotizaciones[inv.ticker];
    return c?.changeAmount ? sum + c.changeAmount * inv.quantity : sum;
  }, 0);

  // ── Billeteras ─────────────────────────────────────────────────────────────
  const totalARS  = wallets.filter((w) => w.currency === "ARS").reduce((s, w) => s + w.balance, 0);
  const walletsUSD = wallets.filter((w) => w.currency === "USD").reduce((s, w) => s + w.balance, 0);
  const foreignUSD = foreignAccounts.reduce((s, a) => s + a.balance, 0);

  // ── Mes actual (ARS) ───────────────────────────────────────────────────────
  const gastosMes    = arsMonthTotals[0]._sum.amount ?? 0;
  const ingresosMes  = arsMonthTotals[1]._sum.amount ?? 0;
  const balanceMes   = ingresosMes - gastosMes;
  const tasaAhorro   = ingresosMes > 0 ? ((ingresosMes - gastosMes) / ingresosMes) * 100 : null;

  const gastosLastMes   = arsMonthTotals[2]._sum.amount ?? 0;
  const ingresosLastMes = arsMonthTotals[3]._sum.amount ?? 0;
  const diffGastos   = gastosLastMes   > 0 ? ((gastosMes   - gastosLastMes)   / gastosLastMes)   * 100 : null;
  const diffIngresos = ingresosLastMes > 0 ? ((ingresosMes - ingresosLastMes) / ingresosLastMes) * 100 : null;

  // ── USD del mes ────────────────────────────────────────────────────────────
  const gastosUSD   = usdMonthTotals[0]._sum.amount ?? 0;
  const ingresosUSD = usdMonthTotals[1]._sum.amount ?? 0;

  // ── Hoy ───────────────────────────────────────────────────────────────────
  const gastadoHoy = isCurrentMonth ? (todayAgg._sum.amount ?? 0) : 0;
  const txHoyCount = isCurrentMonth ? todayCount : 0;

  // ── Presupuesto ────────────────────────────────────────────────────────────
  const presupuestoTotal    = budgets.filter((b) => b.currency === "ARS").reduce((s, b) => s + b.monthlyLimit, 0);
  const presupuestoRestante = Math.max(0, presupuestoTotal - gastosMes);
  const presupuestoPct      = presupuestoTotal > 0 ? (gastosMes / presupuestoTotal) * 100 : null;
  const diasRestantesMes    = isCurrentMonth ? Math.ceil((endOfMonth.getTime() - now.getTime()) / 86400000) : 0;

  // ── Próximo recurrente ─────────────────────────────────────────────────────
  const today = now.getDate();
  const proximoRecurrente = isCurrentMonth ? (() => {
    const proximos = allRecurring
      .filter((r) => r.transactionType === TransactionType.EXPENSE && r.dayOfMonth >= today)
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    return proximos[0] ?? null;
  })() : null;

  // ── Alertas de presupuesto ─────────────────────────────────────────────────
  const gastoPorCat: Record<string, number> = {};
  for (const g of catExpARSPersonal) gastoPorCat[g.category] = g._sum.amount ?? 0;
  const budgetAlerts = budgets
    .filter((b) => b.currency === "ARS")
    .map((b) => ({
      category: b.category,
      spent: gastoPorCat[b.category] ?? 0,
      limit: b.monthlyLimit,
      pct: b.monthlyLimit > 0 ? ((gastoPorCat[b.category] ?? 0) / b.monthlyLimit) * 100 : 0,
    }))
    .filter((a) => a.pct >= 90)
    .sort((a, b) => b.pct - a.pct);

  // ── Categorías ─────────────────────────────────────────────────────────────
  const categoryData = catExpARS
    .map((g) => ({ category: g.category, total: g._sum.amount ?? 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const categoryDataUSD = catExpUSD
    .map((g) => ({ category: g.category, total: g._sum.amount ?? 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── Fijos vs variables ─────────────────────────────────────────────────────
  const fixedExpensesARS    = fixedAgg._sum.amount ?? 0;
  const variableExpensesARS = gastosMes - fixedExpensesARS;

  // ── Ingresos por categoría ─────────────────────────────────────────────────
  const incARSMap: Record<string, number> = {};
  const incUSDMap: Record<string, number> = {};
  for (const g of catIncARS) incARSMap[g.category] = g._sum.amount ?? 0;
  for (const g of catIncUSD) incUSDMap[g.category] = g._sum.amount ?? 0;
  const allIncomeCategories = Array.from(new Set([...Object.keys(incARSMap), ...Object.keys(incUSDMap)]));
  const incomeCategoryData = allIncomeCategories
    .map((category) => ({ category, ars: incARSMap[category] ?? 0, usd: incUSDMap[category] ?? 0 }))
    .sort((a, b) => (b.ars + b.usd * 1000) - (a.ars + a.usd * 1000));

  // ── Gráfico mensual (6 meses, oldest→newest) ──────────────────────────────
  const monthlyData: MonthlyDataPoint[] = Array.from({ length: 6 }, (_, revIdx) => {
    const i = 5 - revIdx;
    const d = monthRanges[i].start;
    return {
      month:    d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
      gastos:   monthlyRaw[i * 2]._sum.amount ?? 0,
      ingresos: monthlyRaw[i * 2 + 1]._sum.amount ?? 0,
    };
  });

  // ── Patrimonio chart ───────────────────────────────────────────────────────
  const wealthData: WealthDataPoint[] = wealthSnapshots.map((s) => ({
    month:    s.date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
    totalARS: s.totalARS,
    totalUSD: s.totalUSD,
  }));

  // ── Delta patrimonial 30d ──────────────────────────────────────────────────
  const totalUSD = walletsUSD + foreignUSD + portfolioUSD;
  const netARS30d = (delta30d[0]._sum.amount ?? 0) - (delta30d[1]._sum.amount ?? 0);
  const netUSD30d = (delta30d[2]._sum.amount ?? 0) - (delta30d[3]._sum.amount ?? 0);
  const patrimonioARS_30d = totalARS - netARS30d;
  const patrimonioUSD_30d = totalUSD - netUSD30d;
  const deltaARSPct = patrimonioARS_30d !== 0 ? (totalARS / patrimonioARS_30d - 1) * 100 : null;
  const deltaUSDPct = patrimonioUSD_30d !== 0 ? (totalUSD / patrimonioUSD_30d - 1) * 100 : null;

  // ── Gasto semana + promedio 4 semanas ─────────────────────────────────────
  const gastoSemana = weekAgg._sum.amount ?? 0;
  const weeklyAmounts = weeklyRaw.map((w) => w._sum.amount ?? 0).filter((a) => a > 0);
  const promedioSemana4w = weeklyAmounts.length > 0
    ? weeklyAmounts.reduce((s, a) => s + a, 0) / weeklyAmounts.length
    : null;

  // ── Sesiones hoy ──────────────────────────────────────────────────────────
  const sessionsTodayData = isCurrentMonth ? sessionsToday.map((s) => ({
    clientName: s.client.name,
    time: s.date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    type: s.type,
  })) : [];

  return (
    <DashboardContent
      mesYM={ym}
      displayName={session.displayName ?? session.username}
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
      mesLabel={new Date(selYear, selMonth - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
      gastadoHoy={gastadoHoy}
      txHoyCount={txHoyCount}
      presupuestoTotal={presupuestoTotal}
      presupuestoRestante={presupuestoRestante}
      presupuestoPct={presupuestoPct}
      diasRestantesMes={diasRestantesMes}
      proximoRecurrente={proximoRecurrente ? {
        description: proximoRecurrente.description,
        amount:      proximoRecurrente.amount,
        currency:    proximoRecurrente.currency,
        dayOfMonth:  proximoRecurrente.dayOfMonth,
      } : null}
      categoryData={categoryData}
      categoryDataUSD={categoryDataUSD}
      fixedExpensesARS={fixedExpensesARS}
      variableExpensesARS={variableExpensesARS}
      incomeCategoryData={incomeCategoryData}
      ingresosUSD={ingresosUSD}
      gastosUSD={gastosUSD}
      monthlyData={monthlyData}
      wealthData={wealthData}
      userCategories={rawCategories.map((c) => ({ name: c.name, icon: c.icon ?? "", type: c.type, color: c.color ?? "" }))}
      recentTransactions={recentTransactions.map((t) => ({
        id:              t.id,
        description:     t.description,
        category:        t.category,
        date:            t.date.toISOString(),
        amount:          t.amount,
        currency:        t.currency,
        type:            t.type,
        source:          t.source,
        isRecurring:     t.recurrentRuleId !== null,
        recurrentRuleId: t.recurrentRuleId ?? null,
      }))}
      budgetAlerts={budgetAlerts}
      sessionsToday={sessionsTodayData}
      deltaARSPct={deltaARSPct}
      deltaUSDPct={deltaUSDPct}
      gastoSemana={gastoSemana}
      promedioSemana4w={promedioSemana4w}
    />
  );
}
