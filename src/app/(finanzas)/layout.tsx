import { Toaster } from "sonner";
import Sidebar from "@/components/ui/Sidebar";
import BottomNav from "@/components/ui/BottomNav";
import LogoutButton from "@/components/ui/LogoutButton";
import QuickAdd from "@/components/finanzas/QuickAdd";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { applyRecurringExpenses } from "@/lib/apply-recurring";
import { saveWealthSnapshotIfNeeded } from "@/lib/save-wealth-snapshot";
import {
  LuLayoutDashboard,
  LuTrendingDown,
  LuTrendingUp,
  LuChartCandlestick,
  LuWallet,
  LuCamera,
  LuTarget,
  LuFileSpreadsheet,
  LuRepeat,
  LuPiggyBank,
} from "react-icons/lu";

const navItems = [
  { href: "/finanzas",              label: "Dashboard",   icon: <LuLayoutDashboard size={18} /> },
  { href: "/finanzas/gastos",       label: "Gastos",      icon: <LuTrendingDown size={18} /> },
  { href: "/finanzas/ingresos",     label: "Ingresos",    icon: <LuTrendingUp size={18} /> },
  { href: "/finanzas/inversiones",  label: "Inversiones", icon: <LuChartCandlestick size={18} /> },
  { href: "/finanzas/billeteras",   label: "Billeteras",  icon: <LuWallet size={18} /> },
  { href: "/finanzas/presupuesto",  label: "Presupuesto", icon: <LuTarget size={18} /> },
  { href: "/finanzas/metas",        label: "Metas",       icon: <LuPiggyBank size={18} /> },
  { href: "/finanzas/recurrentes",  label: "Recurrentes", icon: <LuRepeat size={18} /> },
  { href: "/finanzas/importar",     label: "Importar",    icon: <LuFileSpreadsheet size={18} /> },
];

export default async function FinanzasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const [wallets, foreignAccounts] = await Promise.all([
    db.wallet.findMany({ where: { userId: session.userId }, orderBy: { name: "asc" } }),
    db.foreignAccount.findMany({ where: { userId: session.userId }, orderBy: { name: "asc" } }),
    applyRecurringExpenses(session.userId),
    saveWealthSnapshotIfNeeded(session.userId),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar
          title="Finanzas"
          items={navItems}
          homeHref="/finanzas"
          switchHref="/fotografia"
          switchIcon={<LuCamera size={15} />}
          switchLabel="Ir a Fotografía"
          footer={<LogoutButton username={session.displayName ?? session.username} />}
        />
      </div>

      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6 pb-20 lg:pb-6">{children}</main>

      <BottomNav items={navItems} />
      <QuickAdd wallets={wallets} foreignAccounts={foreignAccounts} />
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
