import { Toaster } from "sonner";
import Sidebar from "@/components/ui/Sidebar";
import BottomNav from "@/components/ui/BottomNav";
import LogoutButton from "@/components/ui/LogoutButton";
import ModuleSwitch from "@/components/ui/ModuleSwitch";
import { requireSession } from "@/lib/auth";
import {
  LuLayoutDashboard,
  LuCalendar,
  LuUsers,
  LuBriefcase,
  LuWand,
} from "react-icons/lu";

const navItems = [
  { href: "/fotografia",           label: "Dashboard", icon: <LuLayoutDashboard size={16} /> },
  { href: "/fotografia/sesiones",  label: "Sesiones",  icon: <LuCalendar size={16} /> },
  { href: "/fotografia/clientes",  label: "Clientes",  icon: <LuUsers size={16} /> },
  { href: "/fotografia/servicios", label: "Servicios", icon: <LuBriefcase size={16} /> },
  { href: "/fotografia/editor",    label: "Editor",    icon: <LuWand size={16} /> },
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
          module="fotografia"
          items={navItems}
          homeHref="/fotografia"
          footer={<LogoutButton username={session.displayName ?? session.username} />}
        />
      </div>

      <div className="flex flex-1 min-w-0 flex-col">
        {/* Top bar: module switch (mobile only) */}
        <header className="flex items-center border-b border-neutral-800 bg-neutral-900 px-4 py-2 lg:hidden">
          <ModuleSwitch />
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-5 pb-20 lg:pb-5">
          {children}
        </main>
      </div>

      <BottomNav items={navItems} />
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
