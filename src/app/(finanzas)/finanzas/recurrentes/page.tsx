export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import RecurringManager from "./RecurringManager";

const CATEGORIAS_GASTO = [
  "Alimentación", "Transporte", "Entretenimiento", "Salud",
  "Servicios", "Ropa", "Educación", "Suscripciones", "Otro",
];
const CATEGORIAS_INGRESO = [
  "Sueldo", "Freelance", "Fotografía", "Inversiones", "Alquiler", "Regalo", "Otro ingreso",
];

const fmtARS = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default async function RecurrentesPage() {
  const { userId } = await requireSession();

  const [items, wallets, foreignAccounts] = await Promise.all([
    db.recurringExpense.findMany({ where: { userId }, orderBy: [{ transactionType: "asc" }, { dayOfMonth: "asc" }] }),
    db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.foreignAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const expenses = items.filter((i) => i.isActive && i.transactionType === "EXPENSE");
  const incomes  = items.filter((i) => i.isActive && i.transactionType === "INCOME");

  const expARS = expenses.filter((i) => i.currency === "ARS").reduce((s, i) => s + i.amount, 0);
  const expUSD = expenses.filter((i) => i.currency === "USD").reduce((s, i) => s + i.amount, 0);
  const incARS = incomes.filter((i)  => i.currency === "ARS").reduce((s, i) => s + i.amount, 0);
  const incUSD = incomes.filter((i)  => i.currency === "USD").reduce((s, i) => s + i.amount, 0);

  const accountMap: Record<string, string> = {};
  for (const w of wallets) accountMap[`wallet:${w.id}`] = `${w.name} (${w.currency})`;
  for (const a of foreignAccounts) accountMap[`foreign:${a.id}`] = `${a.name} (${a.currency})`;

  const serialized = items.map((i) => ({
    id: i.id,
    transactionType: i.transactionType as "EXPENSE" | "INCOME",
    description: i.description,
    amount: i.amount,
    currency: i.currency,
    category: i.category,
    dayOfMonth: i.dayOfMonth,
    isActive: i.isActive,
    lastApplied: i.lastApplied?.toISOString() ?? null,
    accountKey: i.walletId ? `wallet:${i.walletId}` : i.foreignAccountId ? `foreign:${i.foreignAccountId}` : null,
  }));

  const accounts = [
    ...wallets.map((w) => ({ key: `wallet:${w.id}`, label: w.name, currency: w.currency })),
    ...foreignAccounts.map((a) => ({ key: `foreign:${a.id}`, label: a.name, currency: a.currency })),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Recurrentes</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Gastos e ingresos que se registran solos el día del mes que configurás.
      </p>

      {(expARS > 0 || expUSD > 0 || incARS > 0 || incUSD > 0) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {expARS > 0 && (
            <div className="rounded-xl bg-neutral-800 px-4 py-3">
              <p className="text-xs text-neutral-400">Gastos ARS/mes</p>
              <p className="mt-0.5 text-base font-bold text-red-400">{fmtARS(expARS)}</p>
            </div>
          )}
          {expUSD > 0 && (
            <div className="rounded-xl bg-neutral-800 px-4 py-3">
              <p className="text-xs text-neutral-400">Gastos USD/mes</p>
              <p className="mt-0.5 text-base font-bold text-red-400">{fmtUSD(expUSD)}</p>
            </div>
          )}
          {incARS > 0 && (
            <div className="rounded-xl bg-neutral-800 px-4 py-3">
              <p className="text-xs text-neutral-400">Ingresos ARS/mes</p>
              <p className="mt-0.5 text-base font-bold text-green-400">{fmtARS(incARS)}</p>
            </div>
          )}
          {incUSD > 0 && (
            <div className="rounded-xl bg-neutral-800 px-4 py-3">
              <p className="text-xs text-neutral-400">Ingresos USD/mes</p>
              <p className="mt-0.5 text-base font-bold text-green-400">{fmtUSD(incUSD)}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <RecurringManager
          items={serialized}
          categoriasGasto={CATEGORIAS_GASTO}
          categoriasIngreso={CATEGORIAS_INGRESO}
          accounts={accounts}
          accountMap={accountMap}
        />
      </div>
    </div>
  );
}
