"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LuEllipsis, LuX } from "react-icons/lu";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
}

const PRIMARY_COUNT = 4;

export default function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = items.slice(0, PRIMARY_COUNT);
  const secondary = items.slice(PRIMARY_COUNT);
  const moreActive = secondary.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-neutral-800 bg-neutral-900 lg:hidden">
        {primary.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition-colors ${
                active ? "text-white" : "text-neutral-500"
              }`}
            >
              {item.icon}
              <span className={active ? "font-medium" : ""}>{item.label}</span>
            </Link>
          );
        })}

        {/* Botón Más */}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition-colors ${
            moreActive ? "text-white" : "text-neutral-500"
          }`}
        >
          <LuEllipsis size={18} />
          <span className={moreActive ? "font-medium" : ""}>Más</span>
        </button>
      </nav>

      {/* Sheet con el resto de ítems */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-neutral-900 pb-8 pt-4 lg:hidden">
            <div className="mb-3 flex items-center justify-between px-5">
              <p className="text-sm font-medium text-neutral-400">Más opciones</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1 text-neutral-500 hover:text-white"
              >
                <LuX size={18} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 px-3">
              {secondary.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-[11px] transition-colors ${
                      active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span className={active ? "font-medium" : ""}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
