"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
}

export default function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex overflow-x-auto border-t border-neutral-800 bg-neutral-900 lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-[64px] flex-shrink-0 flex-col items-center gap-1 px-2 py-3 text-[11px] transition-colors ${
              active ? "text-white" : "text-neutral-500"
            }`}
          >
            {item.icon}
            <span className={active ? "font-medium" : ""}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
