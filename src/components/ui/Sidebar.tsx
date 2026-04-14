"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  title: string;
  items: NavItem[];
  homeHref: string;
  switchHref: string;
  switchLabel: string;
  switchIcon?: ReactNode;
  footer?: ReactNode;
}

export default function Sidebar({ title, items, homeHref, switchHref, switchLabel, switchIcon, footer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-neutral-800 bg-neutral-900 px-3 py-6">
      <Link href={homeHref} className="mb-6 px-3 font-bold text-white">
        {title}
      </Link>
      <nav className="flex flex-col gap-1">
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
      <div className="mt-auto flex flex-col gap-1">
        <Link
          href={switchHref}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          {switchIcon}
          {switchLabel}
        </Link>
        {footer && <div className="border-t border-neutral-800 pt-1">{footer}</div>}
      </div>
    </aside>
  );
}
