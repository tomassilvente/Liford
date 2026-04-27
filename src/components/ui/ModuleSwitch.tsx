"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuTrendingUp, LuCamera } from "react-icons/lu";

export default function ModuleSwitch({ size = "sm" }: { size?: "sm" | "md" }) {
  const pathname = usePathname();
  const active = pathname.startsWith("/fotografia") ? "fotografia" : "finanzas";

  const pill =
    size === "md"
      ? "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
      : "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors";

  return (
    <div className="flex rounded-lg bg-neutral-800 p-0.5 ring-1 ring-neutral-700">
      <Link
        href="/finanzas"
        className={`${pill} ${
          active === "finanzas"
            ? "bg-neutral-700 text-white shadow-sm"
            : "text-neutral-500 hover:text-neutral-300"
        }`}
      >
        <LuTrendingUp size={size === "md" ? 13 : 11} />
        Finanzas
      </Link>
      <Link
        href="/fotografia"
        className={`${pill} ${
          active === "fotografia"
            ? "bg-neutral-700 text-white shadow-sm"
            : "text-neutral-500 hover:text-neutral-300"
        }`}
      >
        <LuCamera size={size === "md" ? 13 : 11} />
        Foto
      </Link>
    </div>
  );
}
