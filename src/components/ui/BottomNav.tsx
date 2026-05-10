"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LuEllipsis, LuX, LuLogOut } from "react-icons/lu";

interface NavItem {
  href: string;
  label: string;
  num: string;
}

interface BottomNavProps {
  items: NavItem[];
}

const PRIMARY_COUNT = 4;

export default function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const primary = items.slice(0, PRIMARY_COUNT);
  const secondary = items.slice(PRIMARY_COUNT);
  const moreActive = secondary.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      <nav style={{ background: "var(--paper2)", borderTop: "2px solid var(--ink)" }} className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden">
        {primary.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 0",
                textDecoration: "none",
                fontFamily: "var(--font-serif)",
                fontSize: 11,
                fontStyle: "italic",
                color: active ? "var(--ink)" : "var(--ink3)",
                fontWeight: active ? 600 : 400,
                borderRight: "1px solid var(--rule2)",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)" }}>{item.num}</span>
              {item.label}
            </Link>
          );
        })}

        {secondary.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 0",
              background: "transparent", border: "none",
              fontFamily: "var(--font-serif)", fontSize: 11, fontStyle: "italic",
              color: moreActive ? "var(--ink)" : "var(--ink3)",
              cursor: "pointer",
            }}
          >
            <LuEllipsis size={16} />
            Más
          </button>
        )}
      </nav>

      {moreOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setMoreOpen(false)} />
          <div style={{ background: "var(--paper2)", borderTop: "2px solid var(--ink)" }} className="fixed bottom-0 left-0 right-0 z-50 pb-8 pt-4 lg:hidden">
            <div className="mb-3 flex items-center justify-between px-5">
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Más</p>
              <button onClick={() => setMoreOpen(false)} style={{ background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer" }}>
                <LuX size={16} />
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
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px",
                      textDecoration: "none", borderRadius: 0,
                      background: active ? "var(--paper3)" : "transparent",
                      fontFamily: "var(--font-serif)", fontSize: 11, fontStyle: "italic",
                      color: active ? "var(--ink)" : "var(--ink3)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}>{item.num}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div style={{ margin: "12px 12px 0", borderTop: "1px solid var(--rule2)", paddingTop: 12 }}>
              <button
                onClick={handleLogout}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", border: "1px solid var(--rule2)", padding: "10px 0", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)" }}
              >
                <LuLogOut size={13} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
