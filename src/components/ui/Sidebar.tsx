"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  num: string;
}

interface SidebarProps {
  items: NavItem[];
  homeHref: string;
  module: "finanzas" | "fotografia";
  footer?: ReactNode;
}

export default function Sidebar({ items, homeHref, module: currentModule, footer }: SidebarProps) {
  const pathname = usePathname();
  const isFoto = currentModule === "fotografia";

  const bg      = isFoto ? "var(--foto-paper2)" : "var(--paper3)";
  const border  = isFoto ? "var(--foto-rule)"   : "var(--rule2)";
  const ink     = isFoto ? "var(--foto-ink)"    : "var(--ink)";
  const ink3    = isFoto ? "var(--foto-accent)"  : "var(--ink3)";
  const activeBg = isFoto ? "var(--foto-paper)" : "var(--paper)";

  return (
    <aside style={{ width: 168, background: bg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh" }}>
      {/* Masthead */}
      <Link href={homeHref} style={{ display: "block", padding: "20px 14px 16px", borderBottom: `2px solid ${ink}`, textDecoration: "none" }}>
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

      {/* Module switch + footer */}
      <div style={{ padding: "12px 12px 16px", borderTop: `1px solid ${border}` }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: ink3, letterSpacing: "0.16em", margin: "0 0 6px", textTransform: "uppercase" }}>Tomo</p>
        <div style={{ display: "flex", border: `1px solid ${ink}` }}>
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
        {footer && <div style={{ marginTop: 12 }}>{footer}</div>}
      </div>
    </aside>
  );
}
