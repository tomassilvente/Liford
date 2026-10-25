"use client";

import { useState, useMemo } from "react";
import { LuChevronRight, LuChevronDown } from "react-icons/lu";
import MovementRow, { catIcon, type TxRowData, type CatData } from "./MovementRow";

interface Props {
  transactions: TxRowData[];
  catMap: Map<string, CatData>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenRule: (id: string) => void;
}

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " USD";
}

export default function CategoryView({ transactions, catMap, selectedId, onSelect, onOpenRule }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, { arsExp: number; usdExp: number; arsInc: number; usdInc: number; txs: TxRowData[] }>();
    for (const tx of transactions) {
      if (!map.has(tx.category)) map.set(tx.category, { arsExp: 0, usdExp: 0, arsInc: 0, usdInc: 0, txs: [] });
      const g = map.get(tx.category)!;
      if (tx.type === "INCOME") {
        if (tx.currency === "USD") g.usdInc += tx.amount; else g.arsInc += tx.amount;
      } else {
        if (tx.currency === "USD") g.usdExp += tx.amount; else g.arsExp += tx.amount;
      }
      g.txs.push(tx);
    }
    const entries = Array.from(map.entries())
      .sort((a, b) => (b[1].arsExp + b[1].arsInc) - (a[1].arsExp + a[1].arsInc));
    const maxARS = Math.max(...entries.map(([, v]) => Math.max(v.arsExp, v.arsInc)), 1);
    return entries.map(([name, { arsExp, usdExp, arsInc, usdInc, txs }]) => {
      const isIncome = arsInc > 0 && arsExp === 0 && usdExp === 0;
      return {
        name,
        cat: catMap.get(name),
        arsExp, usdExp, arsInc, usdInc,
        txs,
        count: txs.length,
        pct: (Math.max(arsExp, arsInc) / maxARS) * 100,
        isIncome,
      };
    });
  }, [transactions, catMap]);

  if (grouped.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink3)" }}>
        Sin movimientos registrados.
      </p>
    );
  }

  return (
    <div style={{ border: "1px solid var(--rule)" }}>
      {grouped.map((g, i) => (
        <div key={g.name}>
          <div
            onClick={() => setExpanded(expanded === g.name ? null : g.name)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderBottom: "1px solid var(--rule)",
              cursor: "pointer",
              background: expanded === g.name ? "var(--paper2)" : "transparent",
            }}
            onMouseEnter={e => { if (expanded !== g.name) (e.currentTarget as HTMLElement).style.background = "var(--paper2)"; }}
            onMouseLeave={e => { if (expanded !== g.name) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {/* Icon */}
            <div style={{
              width: 34, height: 34, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
              border: `1.5px solid ${g.cat?.color ?? "var(--rule2)"}`,
              background: "var(--paper)",
              userSelect: "none",
            }}>
              {catIcon(g.cat, g.name)}
            </div>

            {/* Name + bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
                  {g.name}
                </span>
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink3)" }}>
                  {g.count} mov.
                </span>
              </div>
              <div style={{ height: 4, background: "var(--paper3)", position: "relative" }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, height: "100%",
                  width: `${g.pct}%`,
                  background: g.isIncome ? "var(--olive)" : (g.cat?.color ?? "var(--brick)"),
                  opacity: 0.65,
                  transition: "width 0.3s",
                }} />
              </div>
            </div>

            {/* Total + chevron */}
            <div style={{ flexShrink: 0, textAlign: "right", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "right" }}>
                {g.arsExp > 0 && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--brick)", fontVariantNumeric: "tabular-nums", margin: 0, whiteSpace: "nowrap" }}>
                    −&thinsp;{fmtARS(g.arsExp)}
                  </p>
                )}
                {g.usdExp > 0 && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--brick)", fontVariantNumeric: "tabular-nums", margin: 0, opacity: 0.7, whiteSpace: "nowrap" }}>
                    −&thinsp;{fmtUSD(g.usdExp)}
                  </p>
                )}
                {g.arsInc > 0 && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--olive)", fontVariantNumeric: "tabular-nums", margin: 0, whiteSpace: "nowrap" }}>
                    +&thinsp;{fmtARS(g.arsInc)}
                  </p>
                )}
                {g.usdInc > 0 && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--olive)", fontVariantNumeric: "tabular-nums", margin: 0, opacity: 0.7, whiteSpace: "nowrap" }}>
                    +&thinsp;{fmtUSD(g.usdInc)}
                  </p>
                )}
              </div>
              {expanded === g.name
                ? <LuChevronDown size={14} style={{ color: "var(--ink3)" }} />
                : <LuChevronRight size={14} style={{ color: "var(--ink3)" }} />
              }
            </div>
          </div>

          {/* Expanded rows */}
          {expanded === g.name && (
            <div style={{ paddingLeft: 46, background: "var(--paper2)" }}>
              {g.txs.map((tx, j) => (
                <div key={tx.id} style={{ borderBottom: j < g.txs.length - 1 ? "1px solid var(--rule)" : "none" }}>
                  <MovementRow
                    tx={tx}
                    catMap={catMap}
                    selected={selectedId === tx.id}
                    onSelect={() => onSelect(tx.id)}
                    onOpenRule={onOpenRule}
                    compact
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
