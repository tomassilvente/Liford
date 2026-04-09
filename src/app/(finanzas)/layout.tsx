import Sidebar from "@/components/ui/Sidebar";

const navItems = [
  { href: "/finanzas", label: "Dashboard", icon: "📊" },
  { href: "/finanzas/gastos", label: "Gastos", icon: "📉" },
  { href: "/finanzas/ingresos", label: "Ingresos", icon: "📈" },
  { href: "/finanzas/inversiones", label: "Inversiones", icon: "💹" },
  { href: "/finanzas/billeteras", label: "Billeteras", icon: "👛" },
];

export default function FinanzasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar title="💰 Finanzas" items={navItems} homeHref="/finanzas" />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
