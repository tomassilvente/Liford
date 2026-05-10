"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  num: string;
}

interface SidebarProps {
  items: NavItem[];
  homeHref: string;
  module: "finanzas" | "fotografia";
}

export default function Sidebar({ items, homeHref, module: currentModule }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isFoto = currentModule === "fotografia";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const bg      = isFoto ? "var(--foto-paper2)" : "var(--paper3)";
  const border  = isFoto ? "var(--foto-rule)"   : "var(--rule2)";
  const ink     = isFoto ? "var(--foto-ink)"    : "var(--ink)";
  const ink3    = isFoto ? "var(--foto-accent)"  : "var(--ink3)";
  const activeBg = isFoto ? "var(--foto-paper)" : "var(--paper)";

  return (
    <aside style={{ width: 168, background: bg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh" }}>
      {/* Masthead */}
      <div style={{ padding: "20px 14px 16px", borderBottom: `2px solid ${ink}` }}>
        <Link href={homeHref} style={{ display: "block", textDecoration: "none" }}>
          {isFoto ? (
            <>
              <p style={{ fontFamily: "var(--font-condensed)", fontSize: 26, lineHeight: 0.95, margin: 0, letterSpacing: "0.04em", color: ink, textTransform: "uppercase" }}>Liford</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.18em", margin: "4px 0 0", color: ink3, textTransform: "uppercase" }}>Atelier · Foto</p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 0.95, margin: 0, fontStyle: "italic", letterSpacing: "-0.02em", color: ink }}>Liford</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.18em", margin: "4px 0 0", color: ink3, textTransform: "uppercase" }}>Almanaque · MMXXVI</p>
            </>
          )}
        </Link>
        {/* Module switch */}
        <div style={{ marginTop: 11, display: "flex", border: `1px solid ${ink}` }}>
          <Link
            href="/finanzas"
            style={{
              flex: 1, textAlign: "center",
              background: !isFoto ? ink : "transparent",
              color: !isFoto ? activeBg : ink,
              padding: "6px 0",
              fontFamily: "var(--font-serif)",
              fontSize: 11,
              fontStyle: !isFoto ? "italic" : "normal",
              textDecoration: "none",
            }}
          >
            Finanzas
          </Link>
          <Link
            href="/fotografia"
            style={{
              flex: 1, textAlign: "center",
              background: isFoto ? ink : "transparent",
              color: isFoto ? activeBg : ink,
              padding: "6px 0",
              fontFamily: isFoto ? "var(--font-condensed)" : "var(--font-serif)",
              fontSize: 11,
              fontStyle: isFoto ? "normal" : "italic",
              letterSpacing: isFoto ? "0.06em" : "normal",
              textTransform: isFoto ? "uppercase" : "none",
              textDecoration: "none",
            }}
          >
            Foto
          </Link>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto" }}>
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== homeHref && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                background: active ? activeBg : "transparent",
                borderTop: `1px solid ${border}`,
                borderRight: active ? `2px solid ${activeBg}` : "2px solid transparent",
                padding: "13px 12px",
                textDecoration: "none",
                fontFamily: isFoto ? "var(--font-condensed)" : "var(--font-serif)",
                fontSize: 14,
                fontStyle: (!isFoto && !active) ? "italic" : "normal",
                letterSpacing: isFoto ? "0.04em" : "normal",
                textTransform: isFoto ? "uppercase" : "none",
                color: active ? ink : ink3,
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, marginRight: 8, color: ink3, letterSpacing: "0.08em" }}>{item.num}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px 12px 14px", borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: ink3, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>Tomo MMXXVI</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: ink3 }}>·</span>
        <button
          onClick={handleLogout}
          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: 11, fontStyle: "italic", color: ink3, letterSpacing: "0.01em" }}
        >
          Salir
        </button>
      </div>
    </aside>
  );
}
