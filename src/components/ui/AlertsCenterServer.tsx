import { db } from "@/lib/db";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";
import AlertsCenter, { type Alert } from "./AlertsCenter";

export default async function AlertsCenterServer({ userId }: { userId: string }) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const in2Days = new Date(now.getTime() + 2 * 86400000);

  const [budgets, gastosMes, sessionsToday, recurringDue, goalsAtRisk] = await Promise.all([
    db.budget.findMany({ where: { userId } }),
    db.transaction.findMany({
      where: { userId, type: TransactionType.EXPENSE, source: TransactionSource.PERSONAL, date: { gte: startOfMonth, lt: endOfMonth } },
    }),
    db.session.findMany({
      where: { client: { userId }, date: { gte: startOfToday, lt: endOfToday } },
      include: { client: { select: { name: true } } },
    }),
    db.recurringExpense.findMany({
      where: { userId, isActive: true, dayOfMonth: { in: [now.getDate(), now.getDate() + 1, now.getDate() + 2] } },
    }),
    db.savingsGoal.findMany({
      where: { userId, isAchieved: false, targetDate: { lte: in2Days } },
      include: { wallet: true, foreignAccount: true },
    }),
  ]);

  const alerts: Alert[] = [];

  // Alertas de presupuesto
  const gastoPorCat: Record<string, number> = {};
  for (const t of gastosMes) {
    if (t.currency === "ARS") gastoPorCat[t.category] = (gastoPorCat[t.category] ?? 0) + t.amount;
  }
  for (const b of budgets) {
    if (b.currency !== "ARS") continue;
    const spent = gastoPorCat[b.category] ?? 0;
    const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
    if (pct >= 100) {
      alerts.push({ id: `budget-${b.id}`, type: "budget", severity: "critical", title: `Presupuesto excedido: ${b.category}`, description: `Gastaste ${pct.toFixed(0)}% del límite mensual` });
    } else if (pct >= 90) {
      alerts.push({ id: `budget-${b.id}`, type: "budget", severity: "warning", title: `Presupuesto al límite: ${b.category}`, description: `${pct.toFixed(0)}% del límite mensual usado` });
    }
  }

  // Sesiones de hoy
  for (const s of sessionsToday) {
    const time = s.date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    alerts.push({ id: `session-${s.id}`, type: "session", severity: "info", title: `Sesión hoy — ${s.client.name}`, description: `${time} · ${s.type}` });
  }

  // Recurrentes próximos
  for (const r of recurringDue) {
    const daysUntil = r.dayOfMonth - now.getDate();
    const when = daysUntil === 0 ? "hoy" : daysUntil === 1 ? "mañana" : `en ${daysUntil} días`;
    alerts.push({ id: `rec-${r.id}`, type: "recurring", severity: "info", title: `${r.description}`, description: `Se aplica ${when} — ${r.transactionType === "EXPENSE" ? "gasto" : "ingreso"} de ${r.amount} ${r.currency}` });
  }

  // Metas en riesgo
  for (const g of goalsAtRisk) {
    const balance = g.wallet?.balance ?? g.foreignAccount?.balance ?? 0;
    const pct = g.targetAmount > 0 ? (balance / g.targetAmount) * 100 : 0;
    alerts.push({ id: `goal-${g.id}`, type: "goal", severity: "warning", title: `Meta en riesgo: ${g.name}`, description: `Vence pronto con ${pct.toFixed(0)}% logrado` });
  }

  return <AlertsCenter alerts={alerts} />;
}
