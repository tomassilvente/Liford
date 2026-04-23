import { Toaster } from "sonner";
import Sidebar from "@/components/ui/Sidebar";
import {
  LuLayoutDashboard,
  LuCalendar,
  LuUsers,
  LuBriefcase,
  LuTrendingUp,
} from "react-icons/lu";

const navItems = [
  { href: "/fotografia",          label: "Dashboard", icon: <LuLayoutDashboard size={18} /> },
  { href: "/fotografia/sesiones", label: "Sesiones",  icon: <LuCalendar size={18} /> },
  { href: "/fotografia/clientes", label: "Clientes",  icon: <LuUsers size={18} /> },
  { href: "/fotografia/servicios",label: "Servicios", icon: <LuBriefcase size={18} /> },
];

export default function FotografiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        title="Fotografía"
        items={navItems}
        homeHref="/fotografia"
        switchHref="/finanzas"
        switchIcon={<LuTrendingUp size={15} />}
        switchLabel="Ir a Finanzas"
      />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
