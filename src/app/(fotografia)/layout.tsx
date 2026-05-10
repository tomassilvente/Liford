import { Toaster } from "sonner";
import Sidebar from "@/components/ui/Sidebar";
import BottomNav from "@/components/ui/BottomNav";
import { requireSession } from "@/lib/auth";

const navItems = [
  { href: "/fotografia",           label: "Sesiones",  num: "I" },
  { href: "/fotografia/clientes",  label: "Clientes",  num: "II" },
  { href: "/fotografia/servicios", label: "Servicios", num: "III" },
  { href: "/fotografia/editor",    label: "Editor",    num: "IV" },
];

export default async function FotografiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--foto-paper)" }}>
      <div className="hidden lg:flex">
        <Sidebar
          module="fotografia"
          items={navItems}
          homeHref="/fotografia"
        />
      </div>

      <div className="flex flex-1 min-w-0 flex-col">
        <header className="flex lg:hidden items-center justify-between" style={{ borderBottom: "2px solid var(--foto-ink)", background: "var(--foto-paper)", padding: "8px 16px" }}>
          <div className="flex" style={{ border: "1px solid var(--foto-ink)" }}>
            <a href="/finanzas" style={{ padding: "5px 12px", background: "transparent", color: "var(--foto-accent)", fontFamily: "var(--font-condensed)", fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none" }}>Finanzas</a>
            <a href="/fotografia" style={{ padding: "5px 12px", background: "var(--foto-ink)", color: "var(--foto-paper)", fontFamily: "var(--font-condensed)", fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none" }}>Foto</a>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 lg:p-8" style={{ background: "var(--foto-paper)" }}>
          {children}
        </main>
      </div>

      <BottomNav items={navItems} />
      <Toaster position="top-center" richColors theme="light" />
    </div>
  );
}
