export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import GoalsManager from "./GoalsManager";

export default async function MetasPage() {
  const { userId } = await requireSession();

  const [goals, wallets, foreignAccounts] = await Promise.all([
    db.savingsGoal.findMany({
      where: { userId },
      include: { wallet: true, foreignAccount: true },
      orderBy: { createdAt: "asc" },
    }),
    db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.foreignAccount.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const accounts = [
    ...wallets.map((w) => ({ key: `wallet:${w.id}`, label: w.name, currency: w.currency, balance: w.balance })),
    ...foreignAccounts.map((a) => ({ key: `foreign:${a.id}`, label: a.name, currency: a.currency, balance: a.balance })),
  ];

  const serialized = goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currency: g.currency,
    notes: g.notes,
    targetDate: g.targetDate?.toISOString() ?? null,
    isAchieved: g.isAchieved,
    accountKey: g.walletId ? `wallet:${g.walletId}` : g.foreignAccountId ? `foreign:${g.foreignAccountId}` : null,
    currentBalance: g.wallet?.balance ?? g.foreignAccount?.balance ?? 0,
  }));

  const active = serialized.filter((g) => !g.isAchieved);
  const achieved = serialized.filter((g) => g.isAchieved);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Metas de ahorro</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Definí objetivos y vinculalos a una cuenta para ver tu progreso en tiempo real.
      </p>

      <div className="mt-8 space-y-10 max-w-2xl">
        <GoalsManager goals={[...active, ...achieved]} accounts={accounts} />
      </div>
    </div>
  );
}
