"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LuTrendingUp, LuCamera } from "react-icons/lu";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  homeHref: string;
  module: "finanzas" | "fotografia";
  footer?: ReactNode;
}

export default function Sidebar({ items, homeHref, module: currentModule, footer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-neutral-800 bg-neutral-900 px-3 py-5">
      <Link href={homeHref} className="mb-4 px-3 text-sm font-bold text-white tracking-wide">
        Liford
      </Link>

      {/* Module segmented control */}
      <div className="mb-4 flex rounded-lg bg-neutral-800 p-0.5 ring-1 ring-neutral-700/50">
        <Link
          href="/finanzas"
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors ${
            currentModule === "finanzas"
              ? "bg-neutral-700 text-white shadow-sm"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <LuTrendingUp size={11} />
          Finanzas
        </Link>
        <Link
          href="/fotografia"
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors ${
            currentModule === "fotografia"
              ? "bg-neutral-700 text-white shadow-sm"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <LuCamera size={11} />
          Foto
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {footer && (
        <div className="mt-auto border-t border-neutral-800 pt-2">
          {footer}
        </div>
      )}
    </aside>
  );
}
