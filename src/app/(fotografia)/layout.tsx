import { Toaster } from "sonner";
import Sidebar from "@/components/ui/Sidebar";
import BottomNav from "@/components/ui/BottomNav";
import LogoutButton from "@/components/ui/LogoutButton";
import { requireSession } from "@/lib/auth";
import {
  LuLayoutDashboard,
  LuCalendar,
  LuUsers,
  LuBriefcase,
  LuTrendingUp,
  LuWand,
} from "react-icons/lu";

const navItems = [
  { href: "/fotografia",           label: "Dashboard", icon: <LuLayoutDashboard size={18} /> },
  { href: "/fotografia/sesiones",  label: "Sesiones",  icon: <LuCalendar size={18} /> },
  { href: "/fotografia/clientes",  label: "Clientes",  icon: <LuUsers size={18} /> },
  { href: "/fotografia/servicios", label: "Servicios", icon: <LuBriefcase size={18} /> },
  { href: "/fotografia/editor",    label: "Editor",    icon: <LuWand size={18} /> },
];

export default async function FotografiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar
          title="Fotografía"
          items={navItems}
          homeHref="/fotografia"
          switchHref="/finanzas"
          switchIcon={<LuTrendingUp size={15} />}
          switchLabel="Ir a Finanzas"
          footer={<LogoutButton username={session.displayName ?? session.username} />}
        />
      </div>
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6 pb-20 lg:pb-6">
        {children}
      </main>
      <BottomNav items={navItems} />
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
