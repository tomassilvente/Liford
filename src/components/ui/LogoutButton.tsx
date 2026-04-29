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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", letterSpacing: "0.06em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</span>
        <Link href="/finanzas/configuracion" title="Configuración" style={{ color: "var(--ink3)", lineHeight: 1 }}>
          <LuSettings size={12} />
        </Link>
      </div>
      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        style={{ background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer", lineHeight: 1 }}
      >
        <LuLogOut size={13} />
      </button>
    </div>
  );
}
