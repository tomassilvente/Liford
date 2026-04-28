export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";
import { fetchDolarBlue } from "@/lib/dolar";
import AnualContent from "./AnualContent";

export default async function AnualPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; moneda?: string }>;
}) {
  const { userId } = await requireSession();
  const { anio, moneda } = await searchParams;

  const now = new Date();
  const year = anio ? Number(anio) : now.getFullYear();
  const displayCurrency = moneda === "USD" ? "USD" : "ARS";

  const from = new Date(year, 0, 1);
  const to = new Date(year + 1, 0, 1);
  const fromPrev = new Date(year - 1, 0, 1);
  const toPrev = new Date(year, 0, 1);

  const [transactions, prevTransactions, usdArs] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: from, lt: to }, source: TransactionSource.PERSONAL },
      orderBy: { date: "asc" },
    }),
    db.transaction.findMany({
      where: { userId, date: { gte: fromPrev, lt: toPrev }, source: TransactionSource.PERSONAL },
    }),
    fetchDolarBlue(),
  ]);

  // Agrupar por mes
  const monthLabels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: monthLabels[i],
    ingresos: 0,
    gastos: 0,
    balance: 0,
  }));

  function toDisplay(amount: number, currency: string): number {
    if (displayCurrency === "ARS") {
      return currency === "USD" ? amount * usdArs : amount;
    } else {
      return currency === "ARS" ? amount / usdArs : amount;
    }
  }

  for (const t of transactions) {
    const m = t.date.getMonth();
    const val = toDisplay(t.amount, t.currency);
    if (t.type === TransactionType.INCOME) monthlyData[m].ingresos += val;
    if (t.type === TransactionType.EXPENSE) monthlyData[m].gastos += val;
  }
  for (const m of monthlyData) {
    m.balance = m.ingresos - m.gastos;
    m.ingresos = Math.round(m.ingresos);
    m.gastos = Math.round(m.gastos);
    m.balance = Math.round(m.balance);
  }

  // Totales del año
  const totalIngresos = monthlyData.reduce((s, m) => s + m.ingresos, 0);
  const totalGastos = monthlyData.reduce((s, m) => s + m.gastos, 0);
  const totalBalance = totalIngresos - totalGastos;

  // Comparativa vs año anterior
  const prevIngresos = prevTransactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((s, t) => s + toDisplay(t.amount, t.currency), 0);
  const prevGastos = prevTransactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((s, t) => s + toDisplay(t.amount, t.currency), 0);

  const diffIngresos = prevIngresos > 0 ? ((totalIngresos - prevIngresos) / prevIngresos) * 100 : null;
  const diffGastos = prevGastos > 0 ? ((totalGastos - prevGastos) / prevGastos) * 100 : null;

  // Top categorías del año
  const catMap: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== TransactionType.EXPENSE) continue;
    catMap[t.category] = (catMap[t.category] ?? 0) + toDisplay(t.amount, t.currency);
  }
  const topCats = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([category, total]) => ({ category, total: Math.round(total) }));

  const availableYears = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) {
    availableYears.push(y);
  }

  return (
    <AnualContent
      year={year}
      displayCurrency={displayCurrency as "ARS" | "USD"}
      monthlyData={monthlyData}
      totalIngresos={totalIngresos}
      totalGastos={totalGastos}
      totalBalance={totalBalance}
      diffIngresos={diffIngresos}
      diffGastos={diffGastos}
      topCats={topCats}
      usdArs={usdArs}
      availableYears={availableYears}
    />
  );
}
