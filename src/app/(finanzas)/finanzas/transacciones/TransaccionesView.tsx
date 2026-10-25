"use client";

import { useState, useMemo } from "react";
import { LuSearch, LuX, LuPlus } from "react-icons/lu";
import MonthFilter from "@/components/finanzas/MonthFilter";
import RecurrentRuleModal from "@/components/finanzas/RecurrentRuleModal";
import MovementRow, { type TxRowData, type CatData } from "@/components/finanzas/MovementRow";
import DetailPanel from "@/components/finanzas/DetailPanel";
import CategoryView from "@/components/finanzas/CategoryView";
import CalendarView from "@/components/finanzas/CalendarView";

// KPI numbers shown without currency symbol — just plain es-AR numbers
const fmtNum = (n: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
// Row amounts keep the currency symbol
const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

interface Props {
  transactions: TxRowData[];
  mesYM: string;
  prevHasData?: boolean;
  nextHasData?: boolean;
  wallets: { id: string; name: string; currency: string }[];
  foreignAccounts: { id: string; name: string; currency: string }[];
  initialTipo?: "" | "EXPENSE" | "INCOME";
  userCategories?: CatData[];
}

type Vista = "list" | "cat" | "cal";

// Mini sparkline: daily ARS expenses as SVG bars
function Sparkline({ transactions, mesYM }: { transactions: TxRowData[]; mesYM: string }) {
  const [year, month] = mesYM.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = new Date().toLocaleDateString("en-CA");
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;

  const daily = useMemo(() => {
    const m = new Map<number, number>();
    for (const tx of transactions) {
      if (tx.type === "INCOME" || tx.currency !== "ARS") continue;
      const day = parseInt(tx.date.slice(8, 10));
      m.set(day, (m.get(day) ?? 0) + tx.amount);
    }
    return Array.from({ length: daysInMonth }, (_, i) => m.get(i + 1) ?? 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, mesYM]);

  const maxVal = Math.max(...daily, 1);
  const H = 36, bw = 3, gap = 1;
  const W = daysInMonth * (bw + gap) - gap;
  const todayDay = todayStr.startsWith(prefix) ? parseInt(todayStr.slice(8)) : -1;

  return (
    <svg width={W} height={H} style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      {daily.map((v, i) => {
        const h = v > 0 ? Math.max(Math.round((v / maxVal) * H), 2) : 0;
        const isToday = i + 1 === todayDay;
        return (
          <rect key={i} x={i * (bw + gap)} y={H - h} width={bw} height={h}
            fill={isToday ? "var(--ink)" : "var(--ink3)"}
            opacity={isToday ? 0.85 : 0.28} />
        );
      })}
    </svg>
  );
}

export default function TransaccionesView({
  transactions,
  mesYM,
  prevHasData = false,
  nextHasData = false,
  initialTipo = "",
  userCategories = [],
}: Props) {
  const [search, setSearch]           = useState("");
  const [typeFilter, setTypeFilter]   = useState<"" | "EXPENSE" | "INCOME">(initialTipo);
  const [catFilter, setCatFilter]     = useState("");
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [vista, setVista]             = useState<Vista>("list");
  const [ruleModalId, setRuleModalId] = useState<string | null>(null);

  const mesLabel = (() => {
    const [y, m] = mesYM.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  })();

  const catMap = useMemo(() => {
    const m = new Map<string, CatData>();
    for (const c of userCategories) m.set(c.name, c);
    return m;
  }, [userCategories]);

  const filtered = useMemo(() => transactions.filter((t) => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (catFilter && t.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.description?.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [transactions, typeFilter, catFilter, search]);

  const kpis = useMemo(() => {
    const inARS  = transactions.filter(t => t.type === "INCOME"  && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
    const inUSD  = transactions.filter(t => t.type === "INCOME"  && t.currency === "USD").reduce((s, t) => s + t.amount, 0);
    const outARS = transactions.filter(t => t.type !== "INCOME"  && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
    const outUSD = transactions.filter(t => t.type !== "INCOME"  && t.currency === "USD").reduce((s, t) => s + t.amount, 0);
    return { inARS, inUSD, outARS, outUSD, netARS: inARS - outARS, netUSD: inUSD - outUSD };
  }, [transactions]);

  const grouped = useMemo(() => {
    const map = new Map<string, { dayKey: string; label: string; subLabel: string; txs: TxRowData[] }>();
    const todayKey     = new Date().toISOString().slice(0, 10);
    const yDate = new Date(); yDate.setUTCDate(yDate.getUTCDate() - 1);
    const yesterdayKey = yDate.toISOString().slice(0, 10);
    const fmtFull = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", timeZone: "UTC" });
    const fmtSub  = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

    for (const t of filtered) {
      const d = new Date(t.date);
      const dayKey = d.toISOString().slice(0, 10);
      if (!map.has(dayKey)) {
        let label: string;
        const sub = fmtSub.format(d);
        if (dayKey === todayKey)          { label = "Hoy"; }
        else if (dayKey === yesterdayKey) { label = "Ayer"; }
        else {
          const raw = fmtFull.format(d);
          label = raw.charAt(0).toUpperCase() + raw.slice(1);
        }
        map.set(dayKey, { dayKey, label, subLabel: sub, txs: [] });
      }
      map.get(dayKey)!.txs.push(t);
    }
    return Array.from(map.values());
  }, [filtered]);

  const selectedTx = selectedId ? transactions.find(t => t.id === selectedId) ?? null : null;

  // Category stats for detail panel
  const catTotal = useMemo(() => {
    if (!selectedTx) return 0;
    return transactions
      .filter(t => t.category === selectedTx.category && t.type !== "INCOME" && t.currency === "ARS")
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, selectedTx]);

  function handleSelect(id: string) {
    setSelectedId(prev => prev === id ? null : id);
  }

  function handleCatClick(cat: string) {
    setCatFilter(prev => prev === cat ? "" : cat);
  }

  const segBtn = (active: boolean): React.CSSProperties => ({
    padding: "4px 11px",
    background: active ? "var(--ink)" : "transparent",
    color: active ? "var(--paper)" : "var(--ink3)",
    border: "none",
    fontFamily: "var(--font-mono)", fontSize: 10,
    letterSpacing: "0.06em", textTransform: "uppercase" as const,
    cursor: "pointer",
  });

  const viewBtn = (active: boolean): React.CSSProperties => ({
    padding: "4px 12px",
    background: active ? "var(--paper2)" : "transparent",
    color: active ? "var(--ink)" : "var(--ink3)",
    border: "1px solid var(--rule2)",
    fontFamily: "var(--font-mono)", fontSize: 10,
    letterSpacing: "0.06em", textTransform: "uppercase" as const,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ marginBottom: 20 }}>
        {/* Top row: month nav (left) + new button (right) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <MonthFilter selected={mesYM} prevHasData={prevHasData} nextHasData={nextHasData} />
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("quickadd:open"))}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--ink)", color: "var(--paper)", border: "none",
              padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 10,
              letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <LuPlus size={12} /> Nuevo movimiento
          </button>
        </div>
        {/* Title */}
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink)", margin: 0, lineHeight: 0.95, fontStyle: "italic", letterSpacing: "-0.02em" }}>
          Movimientos
        </h1>
      </header>

      {/* ── KPIs + sparkline ───────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 28, fontFamily: "var(--font-mono)", fontSize: 18, flexWrap: "wrap", fontVariantNumeric: "tabular-nums" }}>
          <div>
            <span style={{ color: "var(--ink3)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 9, marginRight: 8 }}>Entró</span>
            {kpis.inARS > 0 && <span style={{ color: "var(--olive)" }}>+ {fmtNum(kpis.inARS)}</span>}
            {kpis.inUSD > 0 && <span style={{ color: "var(--olive)", marginLeft: 8 }}>+ {kpis.inUSD.toFixed(2)} USD</span>}
            {kpis.inARS === 0 && kpis.inUSD === 0 && <span style={{ color: "var(--ink3)" }}>—</span>}
          </div>
          <div>
            <span style={{ color: "var(--ink3)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 9, marginRight: 8 }}>Salió</span>
            {kpis.outARS > 0 && <span style={{ color: "var(--brick)" }}>− {fmtNum(kpis.outARS)}</span>}
            {kpis.outUSD > 0 && <span style={{ color: "var(--brick)", marginLeft: 8 }}>− {kpis.outUSD.toFixed(2)} USD</span>}
            {kpis.outARS === 0 && kpis.outUSD === 0 && <span style={{ color: "var(--ink3)" }}>—</span>}
          </div>
          <div>
            <span style={{ color: "var(--ink3)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 9, marginRight: 8 }}>Neto</span>
            {(kpis.inARS > 0 || kpis.outARS > 0) && (
              <span style={{ color: kpis.netARS >= 0 ? "var(--olive)" : "var(--brick)" }}>
                {kpis.netARS >= 0 ? "+" : "−"} {fmtNum(Math.abs(kpis.netARS))}
              </span>
            )}
            {(kpis.inUSD > 0 || kpis.outUSD > 0) && (
              <span style={{ color: kpis.netUSD >= 0 ? "var(--olive)" : "var(--brick)", marginLeft: 8 }}>
                {kpis.netUSD >= 0 ? "+" : "−"} {Math.abs(kpis.netUSD).toFixed(2)} USD
              </span>
            )}
            {kpis.inARS === 0 && kpis.outARS === 0 && kpis.inUSD === 0 && kpis.outUSD === 0 && (
              <span style={{ color: "var(--ink3)" }}>—</span>
            )}
          </div>
        </div>
        <Sparkline transactions={transactions} mesYM={mesYM} />
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--rule2)", borderBottom: "1px solid var(--rule2)", marginBottom: 20, flexWrap: "wrap" }}>
        {/* Type segmented */}
        <div style={{ display: "flex", border: "1px solid var(--rule2)" }}>
          {(["", "EXPENSE", "INCOME"] as const).map((v, i) => (
            <button key={v} onClick={() => setTypeFilter(v)} style={{
              ...segBtn(typeFilter === v),
              borderRight: i < 2 ? "1px solid var(--rule2)" : "none",
            }}>
              {v === "" ? "Todo" : v === "EXPENSE" ? "Gastos" : "Ingresos"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 120, maxWidth: 260, borderBottom: "1px solid var(--ink)", padding: "2px 0" }}>
          <LuSearch size={12} style={{ color: "var(--ink3)", flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="buscar…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer", lineHeight: 1 }}>
              <LuX size={11} />
            </button>
          )}
        </div>

        {/* Active category chip */}
        {catFilter && (
          <button onClick={() => setCatFilter("")}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
            {catFilter} <LuX size={9} />
          </button>
        )}

        {/* View buttons */}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          <button onClick={() => setVista("list")} style={{ ...viewBtn(vista === "list") }}>
            Lista
          </button>
          <button onClick={() => setVista("cat")} style={{ ...viewBtn(vista === "cat") }}>
            Por categorías
          </button>
          <button onClick={() => setVista("cal")} style={{ ...viewBtn(vista === "cal") }}>
            Calendario
          </button>
        </div>

        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", flexShrink: 0 }}>
          {filtered.length} mov.
        </span>
      </div>

      {/* ── Main content + panel ───────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* LIST view */}
          {vista === "list" && (
            grouped.length === 0 ? (
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink3)" }}>
                No hay movimientos en {mesLabel}.
              </p>
            ) : (
              <div>
                {grouped.map(({ dayKey, label, subLabel, txs }, gi) => {
                  const dayNetARS = txs.reduce((s, t) =>
                    t.currency === "ARS" ? s + (t.type === "INCOME" ? t.amount : -t.amount) : s, 0);

                  return (
                    <section key={dayKey} style={{ marginTop: gi === 0 ? 0 : 24 }}>
                      {/* Day header */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, paddingBottom: 5, borderBottom: "1px solid var(--rule2)" }}>
                        <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
                          {label}
                        </span>
                        <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink3)" }}>
                          {subLabel}
                        </span>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: 11, marginLeft: "auto",
                          color: dayNetARS >= 0 ? "var(--olive)" : "var(--brick)",
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {dayNetARS >= 0 ? "+" : "−"}&thinsp;{fmtARS(Math.abs(dayNetARS))}
                        </span>
                      </div>

                      {/* Rows */}
                      <div style={{ border: "1px solid var(--rule)" }}>
                        {txs.map((t, i) => (
                          <div key={t.id} style={{ borderBottom: i < txs.length - 1 ? "1px solid var(--rule)" : "none" }}>
                            <MovementRow
                              tx={t}
                              catMap={catMap}
                              selected={selectedId === t.id}
                              onSelect={() => handleSelect(t.id)}
                              onOpenRule={setRuleModalId}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )
          )}

          {/* CATEGORY view */}
          {vista === "cat" && (
            <CategoryView
              transactions={filtered}
              catMap={catMap}
              selectedId={selectedId}
              onSelect={handleSelect}
              onOpenRule={setRuleModalId}
            />
          )}

          {/* CALENDAR view */}
          {vista === "cal" && (
            <CalendarView
              transactions={filtered}
              mesYM={mesYM}
              catMap={catMap}
              selectedId={selectedId}
              onSelect={handleSelect}
              onOpenRule={setRuleModalId}
            />
          )}
        </div>

        {/* Desktop detail panel */}
        {selectedTx && (
          <div
            className="hidden md:block"
            style={{
              width: 300, flexShrink: 0,
              position: "sticky", top: 0,
              maxHeight: "100vh", overflowY: "auto",
              borderLeft: "1px solid var(--rule2)",
              marginLeft: 24,
            }}
          >
            <DetailPanel
              key={selectedTx.id}
              tx={selectedTx}
              userCategories={userCategories}
              catMap={catMap}
              catTotal={catTotal}
              totalOut={kpis.outARS}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {selectedTx && (
        <>
          <div className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(26,26,26,.28)" }}
            onClick={() => setSelectedId(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{ background: "var(--paper)", borderTop: "2px solid var(--ink)", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div style={{ width: 32, height: 3, background: "var(--rule2)", borderRadius: 2, margin: "10px auto 0" }} />
            <DetailPanel
              key={`m-${selectedTx.id}`}
              tx={selectedTx}
              userCategories={userCategories}
              catMap={catMap}
              catTotal={catTotal}
              totalOut={kpis.outARS}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </>
      )}

      {ruleModalId && (
        <RecurrentRuleModal ruleId={ruleModalId} onClose={() => setRuleModalId(null)} />
      )}
    </div>
  );
}
