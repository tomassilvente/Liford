import { Toaster } from "sonner";
import Sidebar from "@/components/ui/Sidebar";
import BottomNav from "@/components/ui/BottomNav";
import LogoutButton from "@/components/ui/LogoutButton";
import QuickAdd from "@/components/finanzas/QuickAdd";
import ModuleSwitch from "@/components/ui/ModuleSwitch";
import CurrencyToggle from "@/components/ui/CurrencyToggle";
import AlertsCenterServer from "@/components/ui/AlertsCenterServer";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { applyRecurringExpenses } from "@/lib/apply-recurring";
import { saveWealthSnapshotIfNeeded } from "@/lib/save-wealth-snapshot";
import { fetchDolarBlue } from "@/lib/dolar";
import {
  LuLayoutDashboard,
  LuArrowLeftRight,
  LuChartCandlestick,
  LuWallet,
  LuTarget,
  LuFileSpreadsheet,
  LuPiggyBank,
  LuTag,
  LuCalendarDays,
} from "react-icons/lu";

const navItems = [
  { href: "/finanzas",               label: "Dashboard",      icon: <LuLayoutDashboard size={16} /> },
  { href: "/finanzas/transacciones", label: "Transacciones",  icon: <LuArrowLeftRight size={16} /> },
  { href: "/finanzas/anual",         label: "Anual",          icon: <LuCalendarDays size={16} /> },
  { href: "/finanzas/inversiones",   label: "Inversiones",    icon: <LuChartCandlestick size={16} /> },
  { href: "/finanzas/billeteras",    label: "Billeteras",     icon: <LuWallet size={16} /> },
  { href: "/finanzas/presupuesto",   label: "Presupuesto",    icon: <LuTarget size={16} /> },
  { href: "/finanzas/metas",         label: "Metas",          icon: <LuPiggyBank size={16} /> },
  { href: "/finanzas/categorias",    label: "Categorías",     icon: <LuTag size={16} /> },
  { href: "/finanzas/importar",      label: "Importar",       icon: <LuFileSpreadsheet size={16} /> },
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
      <div className="flex h-screen overflow-hidden">
        <div className="hidden lg:flex">
          <Sidebar
            module="finanzas"
            items={navItems}
            homeHref="/finanzas"
            footer={<LogoutButton username={session.displayName ?? session.username} />}
          />
        </div>

        <div className="flex flex-1 min-w-0 flex-col">
          {/* Top bar: module switch (mobile) + currency toggle */}
          <header className="flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-2 lg:px-5">
            <div className="lg:hidden">
              <ModuleSwitch />
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <AlertsCenterServer userId={session.userId} />
              <CurrencyToggle />
            </div>
          </header>

          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-5 pb-20 lg:pb-5">
            {children}
          </main>
        </div>

        <BottomNav items={navItems} />
        <QuickAdd
          wallets={wallets}
          foreignAccounts={foreignAccounts}
          categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? "", type: c.type }))}
        />
        <Toaster position="top-center" richColors theme="dark" />
      </div>
    </CurrencyProvider>
  );
}
