import Sidebar from "@/components/ui/Sidebar";

const navItems = [
  { href: "/fotografia", label: "Dashboard", icon: "📊" },
  { href: "/fotografia/sesiones", label: "Sesiones", icon: "🎯" },
  { href: "/fotografia/clientes", label: "Clientes", icon: "👤" },
  { href: "/fotografia/servicios", label: "Servicios", icon: "📋" },
];

export default function FotografiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar title="📷 Fotografía" items={navItems} homeHref="/fotografia" switchHref="/finanzas" switchLabel="← 💰 Ir a Finanzas" />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
