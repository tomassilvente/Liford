import { Toaster } from "sonner";
import Sidebar from "@/components/ui/Sidebar";
import BottomNav from "@/components/ui/BottomNav";
import QuickAdd from "@/components/finanzas/QuickAdd";
import AlertsCenterServer from "@/components/ui/AlertsCenterServer";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { applyRecurringExpenses } from "@/lib/apply-recurring";
import { saveWealthSnapshotIfNeeded } from "@/lib/save-wealth-snapshot";
import { fetchDolarBlue } from "@/lib/dolar";

const navItems = [
  { href: "/finanzas",                     label: "Inicio",      num: "I"   },
  { href: "/finanzas/transacciones",       label: "Movimientos", num: "II"  },
  { href: "/finanzas/inversiones",         label: "Inversiones", num: "III" },
  { href: "/finanzas/billeteras",          label: "Billeteras",  num: "IV"  },
  { href: "/finanzas/presupuesto",         label: "Presupuesto", num: "V"   },
  { href: "/finanzas/metas",               label: "Metas",       num: "VI"  },
  { href: "/finanzas/configuracion",       label: "Ajustes",     num: "VII" },
];

export default async function FinanzasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const [wallets, foreignAccounts, usdArs, categories] = await Promise.all([
    db.wallet.findMany({ where: { userId: session.userId }, orderBy: { name: "asc" } }),
    db.foreignAccount.findMany({ where: { userId: session.userId }, orderBy: { name: "asc" } }),
    fetchDolarBlue(),
    db.category.findMany({
      where: { userId: session.userId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    applyRecurringExpenses(session.userId),
    saveWealthSnapshotIfNeeded(session.userId),
  ]);

  return (
    <CurrencyProvider usdArs={usdArs}>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--paper)" }}>
        <div className="hidden lg:flex">
          <Sidebar
            module="finanzas"
            items={navItems}
            homeHref="/finanzas"
          />
        </div>

        <div className="flex flex-1 min-w-0 flex-col">
          {/* Top bar */}
          <header style={{ borderBottom: "1px solid var(--rule2)", background: "var(--paper2)", padding: "8px 16px" }} className="flex items-center justify-between gap-3">
            {/* Mobile only: module switch */}
            <div className="flex lg:hidden" style={{ border: "1px solid var(--ink)" }}>
              <a href="/finanzas" style={{ padding: "5px 12px", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-serif)", fontSize: 12, fontStyle: "italic", textDecoration: "none" }}>Finanzas</a>
              <a href="/fotografia" style={{ padding: "5px 12px", background: "transparent", color: "var(--ink3)", fontFamily: "var(--font-serif)", fontSize: 12, fontStyle: "italic", textDecoration: "none" }}>Foto</a>
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <AlertsCenterServer userId={session.userId} />
            </div>
          </header>

          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 lg:p-8" style={{ background: "var(--paper)" }}>
            {children}
          </main>
        </div>

        <BottomNav items={navItems} />
        <QuickAdd
          wallets={wallets}
          foreignAccounts={foreignAccounts}
          categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? "", type: c.type }))}
        />
        <Toaster position="top-center" richColors theme="light" />
      </div>
    </CurrencyProvider>
  );
}
