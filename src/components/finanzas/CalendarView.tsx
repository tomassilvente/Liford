"use client";

import { useState, useMemo } from "react";
import MovementRow, { catIcon, type TxRowData, type CatData } from "./MovementRow";

interface Props {
  transactions: TxRowData[];
  mesYM: string;
  catMap: Map<string, CatData>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenRule: (id: string) => void;
}

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

// 5-level heatmap: transparent → light tan → dark brown
const HEAT = ["transparent", "#f0e6d0", "#dfc99e", "#c9a96e", "#9d7a47"] as const;

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function CalendarView({ transactions, mesYM, catMap, selectedId, onSelect, onOpenRule }: Props) {
  const [year, month] = mesYM.split("-").map(Number);
  const daysInMonth   = new Date(year, month, 0).getDate();
  const firstDayMon   = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0
  const todayKey      = new Date().toLocaleDateString("en-CA");

  // Auto-select today if it's in the current month, else null
  const [selectedDay, setSelectedDay] = useState<string | null>(() =>
    todayKey.startsWith(mesYM) ? todayKey : null
  );

  // Daily ARS expense per day
  const dailyExpenses = useMemo(() => {
    const m = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === "INCOME") continue;
      const day = tx.date.slice(0, 10);
      m.set(day, (m.get(day) ?? 0) + tx.amount);
    }
    return m;
  }, [transactions]);

  const maxExpense = Math.max(...Array.from(dailyExpenses.values()), 1);

  function heatLevel(dayKey: string): 0 | 1 | 2 | 3 | 4 {
    const v = dailyExpenses.get(dayKey) ?? 0;
    if (v === 0) return 0;
    const p = v / maxExpense;
    if (p < 0.25) return 1;
    if (p < 0.5)  return 2;
    if (p < 0.75) return 3;
    return 4;
  }

  // Transactions for selected day
  const selectedTxs = useMemo(() =>
    selectedDay ? transactions.filter(tx => tx.date.slice(0, 10) === selectedDay) : [],
    [transactions, selectedDay]
  );

  // Day header labels
  function dayLabel(key: string): { label: string; sub: string } {
    if (key === todayKey) return { label: "Hoy", sub: new Date(key + "T12:00:00Z").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }) };
    const yDate = new Date(); yDate.setUTCDate(yDate.getUTCDate() - 1);
    const yesterdayKey = yDate.toLocaleDateString("en-CA");
    if (key === yesterdayKey) return { label: "Ayer", sub: new Date(key + "T12:00:00Z").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }) };
    const raw = new Date(key + "T12:00:00Z").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
    return { label: raw.charAt(0).toUpperCase() + raw.slice(1), sub: "" };
  }

  const dayNetARS = useMemo(() => {
    if (!selectedDay) return 0;
    return selectedTxs.reduce((s, t) =>
      t.currency === "ARS" ? s + (t.type === "INCOME" ? t.amount : -t.amount) : s, 0);
  }, [selectedTxs, selectedDay]);

  // Build calendar cells
  const cells: Array<{ dayKey: string; day: number } | null> = [
    ...Array(firstDayMon).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      dayKey: `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
      day: i + 1,
    })),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isToday  = (k: string) => k === todayKey;
  const isSel    = (k: string) => k === selectedDay;

  return (
    <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
      {/* ── Calendar grid ── */}
      <div style={{ flexShrink: 0, width: 380 }}>
        {/* Day-of-week header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "4px 0",
              fontFamily: "var(--font-mono)", fontSize: 9,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--ink3)",
            }}>{d}</div>
          ))}
        </div>

        {/* Weeks */}
        <div style={{ border: "1px solid var(--rule)" }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{
              display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
              borderBottom: wi < weeks.length - 1 ? "1px solid var(--rule)" : "none",
            }}>
              {week.map((cell, ci) => {
                if (!cell) return (
                  <div key={ci} style={{
                    minHeight: 46,
                    background: "var(--paper2)",
                    borderRight: ci < 6 ? "1px solid var(--rule)" : "none",
                  }} />
                );
                const level = heatLevel(cell.dayKey);
                const today = isToday(cell.dayKey);
                const sel   = isSel(cell.dayKey);
                return (
                  <div
                    key={ci}
                    onClick={() => setSelectedDay(cell.dayKey === selectedDay ? null : cell.dayKey)}
                    style={{
                      minHeight: 46,
                      padding: "5px 7px",
                      borderRight: ci < 6 ? "1px solid var(--rule)" : "none",
                      background: HEAT[level],
                      cursor: "pointer",
                      // Today: inset border outline
                      boxShadow: today ? "inset 0 0 0 2px var(--ink)" : sel ? "inset 0 0 0 1.5px var(--ink3)" : "none",
                      position: "relative",
                    }}
                  >
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 11,
                      color: level >= 3 ? "var(--paper)" : "var(--ink)",
                      lineHeight: 1,
                    }}>{cell.day}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink3)", letterSpacing: "0.1em", textTransform: "uppercase", marginRight: 2 }}>
            Menos
          </span>
          {HEAT.map((color, i) => (
            <div key={i} style={{
              width: 14, height: 14,
              background: color || "var(--paper)",
              border: "1px solid var(--rule)",
            }} />
          ))}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink3)", letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: 2 }}>
            Más gasto
          </span>
        </div>
      </div>

      {/* ── Day detail ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!selectedDay ? (
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink3)", marginTop: 16 }}>
            Tocá un día para ver qué pasó.
          </p>
        ) : (
          <>
            {/* Day header */}
            {(() => {
              const { label, sub } = dayLabel(selectedDay);
              return (
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--rule2)" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{label}</span>
                  {sub && <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink3)" }}>{sub}</span>}
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 13, marginLeft: "auto",
                    color: dayNetARS >= 0 ? "var(--olive)" : "var(--brick)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {dayNetARS >= 0 ? "+" : "−"}&thinsp;{fmtARS(Math.abs(dayNetARS))}
                  </span>
                </div>
              );
            })()}

            {selectedTxs.length === 0 ? (
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink3)" }}>
                Sin movimientos este día.
              </p>
            ) : (
              <div style={{ border: "1px solid var(--rule)" }}>
                {selectedTxs.map((tx, i) => (
                  <div key={tx.id} style={{ borderBottom: i < selectedTxs.length - 1 ? "1px solid var(--rule)" : "none" }}>
                    <MovementRow
                      tx={tx}
                      catMap={catMap}
                      selected={selectedId === tx.id}
                      onSelect={() => onSelect(tx.id)}
                      onOpenRule={onOpenRule}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
