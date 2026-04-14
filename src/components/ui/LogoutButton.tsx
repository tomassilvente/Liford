"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LuLogOut, LuSettings } from "react-icons/lu";

interface LogoutButtonProps {
  username: string;
}

export default function LogoutButton({ username }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="truncate text-sm text-neutral-400">{username}</span>
        <Link
          href="/finanzas/configuracion"
          title="Configuración"
          className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-700 hover:text-white transition-colors"
        >
          <LuSettings size={14} />
        </Link>
      </div>
      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-white transition-colors"
      >
        <LuLogOut size={15} />
      </button>
    </div>
  );
}
