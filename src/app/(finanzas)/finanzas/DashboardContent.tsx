"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { MonthlyDataPoint } from "@/components/finanzas/MonthlyChart";
import type { WealthDataPoint } from "@/components/finanzas/WealthChart";
import MonthFilter from "@/components/finanzas/MonthFilter";
import { catIcon, type TxRowData, type CatData } from "@/components/finanzas/MovementRow";
import DetailPanel from "@/components/finanzas/DetailPanel";

interface BudgetAlert {
  category: string;
  spent: number;
  limit: number;
  pct: number;
}

interface SessionToday {
  clientName: string;
  time: string;
  type: string;
}

interface RecentTransaction {
  id: string;
  description: string | null;
  category: string;
  date: string;
  amount: number;
  currency: string;
  type: string;
  source: string;
  isRecurring: boolean;
  recurrentRuleId: string | null;
}

interface Props {
  mesYM: string;
  displayName: string;
  totalARS: number;
  walletsARSCount: number;
  foreignUSD: number;
  foreignAccountsCount: number;
  portfolioUSD: number;
  walletsUSD: number;
  investmentsCount: number;
  portfolioDayChange: number;
  ingresosMes: number;
  gastosMes: number;
  balanceMes: number;
  tasaAhorro: number | null;
  diffGastos: number | null;
  diffIngresos: number | null;
  mesLabel: string;
  gastadoHoy: number;
  txHoyCount: number;
  presupuestoTotal: number;
  presupuestoRestante: number;
  presupuestoPct: number | null;
  diasRestantesMes: number;
  proximoRecurrente: { description: string; amount: number; currency: string; dayOfMonth: number } | null;
  categoryData: { category: string; total: number }[];
  categoryDataUSD: { category: string; total: number }[];
  fixedExpensesARS: number;
  variableExpensesARS: number;
  incomeCategoryData: { category: string; ars: number; usd: number }[];
  ingresosUSD: number;
  gastosUSD: number;
  monthlyData: MonthlyDataPoint[];
  wealthData: WealthDataPoint[];
  recentTransactions: RecentTransaction[];
  userCategories: CatData[];
  budgetAlerts: BudgetAlert[];
  sessionsToday: SessionToday[];
  deltaARSPct: number | null;
  deltaUSDPct: number | null;
  gastoSemana: number;
  promedioSemana4w: number | null;
}

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

// ─── Mobile ────────────────────────────────────────────────────────────────
function DashboardMobile({
  totalARS, totalUSD,
  deltaARSPct, deltaUSDPct,
  gastoSemana, promedioSemana4w,
  balanceMes, tasaAhorro,
  recentTransactions,
  mesLabel, diasRestantesMes,
  selectedTxId, setSelectedTxId,
}: {
  totalARS: number; totalUSD: number;
  deltaARSPct: number | null; deltaUSDPct: number | null;
  gastoSemana: number; promedioSemana4w: number | null;
  balanceMes: number; tasaAhorro: number | null;
  recentTransactions: RecentTransaction[];
  mesLabel: string; diasRestantesMes: number;
  selectedTxId: string | null;
  setSelectedTxId: (id: string | null) => void;
}) {
  const semanaDeltaPct = promedioSemana4w && promedioSemana4w > 0
    ? (gastoSemana / promedioSemana4w - 1) * 100
    : null;
  const top4 = recentTransactions.slice(0, 4);
  const now = new Date();

  return (
    <div style={{ padding: "16px 20px 100px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink3)", margin: "0 0 18px" }}>
        {mesLabel} · día {now.getDate()} · quedan {diasRestantesMes}
      </p>

      {/* HERO — Balance del mes */}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>
        Balance · este mes
      </p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 52, lineHeight: 1, margin: "4px 0 0", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", color: balanceMes >= 0 ? "#586e3d" : "#c14a3a", fontStyle: "italic" }}>
        {balanceMes >= 0 ? "+" : "−"} {fmtARS(Math.abs(balanceMes))}
      </p>
      {tasaAhorro !== null && (
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink3)", margin: "4px 0 0" }}>
          ahorrás el {tasaAhorro.toFixed(0)}% de lo que entra
        </p>
      )}

      {/* Patrimonio ARS + USD */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--rule)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Total ARS</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--ink)", margin: "2px 0 0", fontVariantNumeric: "tabular-nums" }}>{fmtARS(totalARS)}</p>
          {deltaARSPct !== null && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: deltaARSPct >= 0 ? "#586e3d" : "#c14a3a", margin: "2px 0 0", letterSpacing: "0.04em" }}>
              {deltaARSPct >= 0 ? "▲ +" : "▼ −"}{Math.abs(deltaARSPct).toFixed(0)}% · 30d
            </p>
          )}
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Total USD</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--ink)", margin: "2px 0 0", fontVariantNumeric: "tabular-nums" }}>
            {fmtUSD(totalUSD)} <span style={{ fontSize: 10, color: "var(--ink3)" }}>USD</span>
          </p>
          {deltaUSDPct !== null && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: deltaUSDPct >= 0 ? "#586e3d" : "#c14a3a", margin: "2px 0 0", letterSpacing: "0.04em" }}>
              {deltaUSDPct >= 0 ? "▲ +" : "▼ −"}{Math.abs(deltaUSDPct).toFixed(0)}% · 30d
            </p>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, padding: "14px 16px", background: "var(--paper2)", border: "1px solid var(--rule2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Esta semana · gastaste</p>
          {semanaDeltaPct !== null && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.04em", color: semanaDeltaPct > 0 ? "#c14a3a" : "#586e3d" }}>
              {semanaDeltaPct > 0 ? "▲ +" : "▼ −"}{Math.abs(semanaDeltaPct).toFixed(0)}% vs prom.
            </span>
          )}
        </div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1, margin: "6px 0 4px", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: "var(--ink)", fontStyle: "italic" }}>
          {fmtARS(gastoSemana)}
        </p>
        {promedioSemana4w !== null && (
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink3)", margin: 0 }}>
            promedio últimas 4 semanas · {fmtARS(promedioSemana4w)}
          </p>
        )}
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, margin: "22px 0 8px", letterSpacing: "-0.02em" }}>Últimos</h2>
      <div style={{ border: "1px solid var(--rule)" }}>
        {top4.map((t, i) => {
          const isExpense = t.type !== "INCOME";
          const date = new Date(t.date);
          const todayD = new Date();
          const isToday = date.toLocaleDateString("en-CA", { timeZone: "UTC" }) === todayD.toLocaleDateString("en-CA");
          const yestD = new Date(todayD); yestD.setDate(yestD.getDate() - 1);
          const isYest = date.toLocaleDateString("en-CA", { timeZone: "UTC" }) === yestD.toLocaleDateString("en-CA");
          const shortDate = date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" });
          const dateLabel = isToday ? "Hoy" : isYest ? "Ayer" : shortDate;
          const sel = selectedTxId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTxId(sel ? null : t.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: i < top4.length - 1 ? "1px solid var(--rule)" : "none", cursor: "pointer", background: sel ? "var(--paper2)" : "transparent", borderLeft: sel ? "3px solid var(--ink)" : "3px solid transparent" }}
              onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "var(--paper2)"; }}
              onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, border: "1.5px solid var(--rule2)", background: "var(--paper)", userSelect: "none" }}>
                {catIcon(undefined, t.category)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.description ?? t.category}
                </p>
                <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink3)", margin: "1px 0 0" }}>
                  {dateLabel} · {t.category}
                </p>
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: isExpense ? "var(--brick)" : "var(--olive)", margin: 0, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
                {isExpense ? "−" : "+"}&thinsp;{t.currency === "USD" ? `${fmtUSD(t.amount)} USD` : fmtARS(t.amount)}
              </p>
            </div>
          );
        })}
      </div>
      <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, margin: "12px 0 0", textAlign: "center" }}>
        <Link href="/finanzas/transacciones" style={{ color: "var(--navy)", textDecoration: "none" }}>ver todos →</Link>
      </p>
    </div>
  );
}

// ─── Desktop (V3) ──────────────────────────────────────────────────────────
export default function DashboardContent({
  mesYM,
  totalARS, walletsUSD, foreignUSD, portfolioUSD,
  ingresosMes, gastosMes, balanceMes, tasaAhorro,
  diffGastos, diffIngresos, mesLabel, diasRestantesMes,
  categoryData, incomeCategoryData, ingresosUSD, gastosUSD,
  recentTransactions, userCategories,
  deltaARSPct, deltaUSDPct,
  gastoSemana, promedioSemana4w,
}: Props) {
  const totalUSD = walletsUSD + foreignUSD + portfolioUSD;
  const catConPct = categoryData.map((c) => ({
    ...c,
    pct: ingresosMes > 0 ? (c.total / ingresosMes) * 100 : 0,
  }));

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const selectedTx = selectedTxId
    ? recentTransactions.find(t => t.id === selectedTxId) ?? null
    : null;

  const catMap = useMemo(() => {
    const m = new Map<string, CatData>();
    for (const c of userCategories) m.set(c.name, c);
    return m;
  }, [userCategories]);

  const catTotal = useMemo(() => {
    if (!selectedTx) return 0;
    if (selectedTx.type === "INCOME") {
      return incomeCategoryData.find(c => c.category === selectedTx.category)?.ars ?? 0;
    }
    return categoryData.find(c => c.category === selectedTx.category)?.total ?? 0;
  }, [selectedTx, categoryData, incomeCategoryData]);

  const totalOut = selectedTx?.type === "INCOME" ? ingresosMes : gastosMes;

  function asTxRowData(t: RecentTransaction): TxRowData {
    return {
      id: t.id, type: t.type as TxRowData["type"],
      amount: t.amount, currency: t.currency,
      category: t.category, description: t.description,
      source: t.source, date: t.date,
      isRecurring: t.isRecurring, recurrentRuleId: t.recurrentRuleId,
    };
  }

  return (
    <div>
      {/* ── Mobile ───────────────────────────────────────────────── */}
      <div className="md:hidden">
        <DashboardMobile
          totalARS={totalARS}
          totalUSD={totalUSD}
          deltaARSPct={deltaARSPct}
          deltaUSDPct={deltaUSDPct}
          gastoSemana={gastoSemana}
          promedioSemana4w={promedioSemana4w}
          balanceMes={balanceMes}
          tasaAhorro={tasaAhorro}
          recentTransactions={recentTransactions}
          mesLabel={mesLabel}
          diasRestantesMes={diasRestantesMes}
          selectedTxId={selectedTxId}
          setSelectedTxId={setSelectedTxId}
        />
      </div>

      {/* ── Desktop ──────────────────────────────────────────────── */}
      <div className="hidden md:block">

        {/* Header compacto */}
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, paddingBottom: 14, borderBottom: "1px solid var(--rule)" }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>
              {mesLabel}
            </p>
            {diasRestantesMes > 0 && (
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink3)", margin: "2px 0 0" }}>
                quedan {diasRestantesMes} días en el mes
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Patrimonio · ARS</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, margin: "2px 0 0", color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
                {fmtARS(totalARS)}
              </p>
              {deltaARSPct !== null && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, margin: "2px 0 0", color: deltaARSPct >= 0 ? "#586e3d" : "#c14a3a", letterSpacing: "0.04em" }}>
                  {deltaARSPct >= 0 ? "▲ +" : "▼ −"}{Math.abs(deltaARSPct).toFixed(0)}% · 30d
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Patrimonio · USD</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, margin: "2px 0 0", color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
                {fmtUSD(totalUSD)} <span style={{ fontSize: 10, color: "var(--ink3)" }}>USD</span>
              </p>
              {deltaUSDPct !== null && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, margin: "2px 0 0", color: deltaUSDPct >= 0 ? "#586e3d" : "#c14a3a", letterSpacing: "0.04em" }}>
                  {deltaUSDPct >= 0 ? "▲ +" : "▼ −"}{Math.abs(deltaUSDPct).toFixed(0)}% · 30d
                </p>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <MonthFilter selected={mesYM} />
              <Link href="/finanzas/billeteras" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--navy)", textDecoration: "none" }}>
                Billeteras →
              </Link>
            </div>
          </div>
        </header>

        {/* HERO — Balance del mes */}
        <section style={{ marginBottom: 36 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>
            Balance · este mes · ARS
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 96, lineHeight: 1, margin: "6px 0 0", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", color: balanceMes >= 0 ? "#586e3d" : "#c14a3a", fontStyle: "italic" }}>
            {balanceMes >= 0 ? "+" : "−"} {fmtARS(Math.abs(balanceMes))}
          </p>
          {tasaAhorro !== null && (
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ink2)", margin: "6px 0 0" }}>
              ahorrás el {tasaAhorro.toFixed(0)}% de lo que entra
            </p>
          )}
        </section>

        {/* Ingresos / Gastos ARS */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 36 }}>
          <div style={{ borderTop: "2px solid #586e3d", paddingTop: 12 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Ingresos · ARS</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 36, margin: "4px 0 0", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: "var(--ink)", fontWeight: 500 }}>
              {fmtARS(ingresosMes)}
            </p>
            {diffIngresos !== null && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: diffIngresos >= 0 ? "#586e3d" : "#c14a3a", margin: "4px 0 0" }}>
                {diffIngresos >= 0 ? "▲ +" : "▼ "}{diffIngresos.toFixed(0)}% vs mes ant.
              </p>
            )}
          </div>
          <div style={{ borderTop: "2px solid #c14a3a", paddingTop: 12 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Gastos · ARS</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 36, margin: "4px 0 0", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: "var(--ink)", fontWeight: 500 }}>
              {fmtARS(gastosMes)}
            </p>
            {diffGastos !== null && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: diffGastos > 0 ? "#c14a3a" : "#586e3d", margin: "4px 0 0" }}>
                {diffGastos >= 0 ? "▲ +" : "▼ "}{diffGastos.toFixed(0)}% vs mes ant.
                {ingresosMes > 0 && ` · ${((gastosMes / ingresosMes) * 100).toFixed(0)}% de tus ingresos`}
              </p>
            )}
          </div>
        </section>

        {/* Ingresos / Gastos USD */}
        {(ingresosUSD > 0 || gastosUSD > 0) && (
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 40, paddingBottom: 28, borderBottom: "1px solid var(--rule)" }}>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Ingresos · USD</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, margin: "2px 0 0", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
                {fmtUSD(ingresosUSD)} <span style={{ fontSize: 10, color: "var(--ink3)" }}>USD</span>
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Gastos · USD</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, margin: "2px 0 0", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
                {fmtUSD(gastosUSD)} <span style={{ fontSize: 10, color: "var(--ink3)" }}>USD</span>
              </p>
            </div>
          </section>
        )}

        {/* En qué se va */}
        {catConPct.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24, margin: 0, letterSpacing: "-0.02em" }}>En qué se va</h2>
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink3)", margin: 0 }}>% sobre tus ingresos del mes</p>
            </div>
            <div style={{ border: "1px solid var(--rule)" }}>
              {catConPct.map((c, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: idx < catConPct.length - 1 ? "1px solid var(--rule)" : "none", background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--paper2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{ width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: "1.5px solid var(--rule2)", background: "var(--paper)", userSelect: "none" }}>
                    {catIcon(undefined, c.category)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{c.category}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: c.pct > 15 ? "var(--brick)" : "var(--ink3)", letterSpacing: "0.04em" }}>{c.pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 4, background: "var(--paper3)", position: "relative" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min((c.pct / 20) * 100, 100)}%`, background: c.pct > 15 ? "var(--brick)" : "var(--ink2)", opacity: 0.65, transition: "width 0.3s" }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--brick)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
                    −&thinsp;{fmtARS(c.total)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Últimos movimientos */}
        {recentTransactions.length > 0 && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24, margin: 0, letterSpacing: "-0.02em" }}>Últimos movimientos</h2>
              <Link href="/finanzas/transacciones" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--navy)", textDecoration: "none" }}>ver todos →</Link>
            </div>
            <div style={{ border: "1px solid var(--rule)" }}>
              {recentTransactions.map((t, i) => {
                const isExpense = t.type !== "INCOME";
                const date = new Date(t.date);
                const todayD = new Date();
                const isToday = date.toLocaleDateString("en-CA", { timeZone: "UTC" }) === todayD.toLocaleDateString("en-CA");
                const yestD = new Date(todayD); yestD.setDate(yestD.getDate() - 1);
                const isYest = date.toLocaleDateString("en-CA", { timeZone: "UTC" }) === yestD.toLocaleDateString("en-CA");
                const shortDate = date.toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
                const dateLabel = isToday ? "Hoy" : isYest ? "Ayer" : shortDate;
                const sel = selectedTxId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTxId(sel ? null : t.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < recentTransactions.length - 1 ? "1px solid var(--rule)" : "none", cursor: "pointer", background: sel ? "var(--paper2)" : "transparent", borderLeft: sel ? "3px solid var(--ink)" : "3px solid transparent" }}
                    onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "var(--paper2)"; }}
                    onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div style={{ width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: "1.5px solid var(--rule2)", background: "var(--paper)", userSelect: "none" }}>
                      {catIcon(undefined, t.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.description ?? t.category}
                      </p>
                      <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink3)", margin: "2px 0 0" }}>
                        {dateLabel} · {t.category}
                      </p>
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: isExpense ? "var(--brick)" : "var(--olive)", margin: 0, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {isExpense ? "−" : "+"}&thinsp;{t.currency === "USD" ? `${fmtUSD(t.amount)} USD` : fmtARS(t.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>{/* end desktop */}

      {/* ── Detail panel (desktop fixed right + mobile bottom sheet) ── */}
      {selectedTx && (
        <>
          {/* Backdrop — click to close */}
          <div
            onClick={() => setSelectedTxId(null)}
            className="hidden md:block"
            style={{ position: "fixed", inset: 0, zIndex: 48 }}
          />

          {/* Desktop: fixed right panel */}
          <div
            className="hidden md:block"
            style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 320, background: "var(--paper)", borderLeft: "1px solid var(--rule2)", overflowY: "auto", zIndex: 49 }}
            key={selectedTx.id}
          >
            <DetailPanel
              tx={asTxRowData(selectedTx)}
              userCategories={userCategories}
              catMap={catMap}
              catTotal={catTotal}
              totalOut={totalOut}
              onClose={() => setSelectedTxId(null)}
            />
          </div>

          {/* Mobile: bottom sheet */}
          <div
            className="md:hidden"
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--paper)", borderTop: "2px solid var(--ink)", maxHeight: "70vh", overflowY: "auto", zIndex: 50 }}
            key={selectedTx.id + "-m"}
          >
            <div style={{ width: 32, height: 4, background: "var(--ink3)", margin: "8px auto 4px", borderRadius: 2 }} />
            <DetailPanel
              tx={asTxRowData(selectedTx)}
              userCategories={userCategories}
              catMap={catMap}
              catTotal={catTotal}
              totalOut={totalOut}
              onClose={() => setSelectedTxId(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}
