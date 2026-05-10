"use client";

import Link from "next/link";
import type { MonthlyDataPoint } from "@/components/finanzas/MonthlyChart";
import type { WealthDataPoint } from "@/components/finanzas/WealthChart";
import WealthChart from "@/components/finanzas/WealthChart";
import MonthlyChart from "@/components/finanzas/MonthlyChart";
import MonthFilter from "@/components/finanzas/MonthFilter";

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

function WavyRule({ width = 160 }: { width?: number }) {
  return (
    <svg width={width} height={6} viewBox={`0 0 ${width} 6`} style={{ display: "block", margin: "8px 0" }}>
      <path
        d={`M0,3 Q${width / 8},0 ${width / 4},3 T${width / 2},3 T${(3 * width) / 4},3 T${width},3`}
        stroke="var(--rule2)" strokeWidth="1" fill="none"
      />
    </svg>
  );
}

function Stamp({ children, color = "var(--stamp)", rot = -8, size = 70 }: { children: React.ReactNode; color?: string; rot?: number; size?: number }) {
  return (
    <div style={{
      width: size, height: size, transform: `rotate(${rot}deg)`,
      border: `2px solid ${color}`, borderRadius: "50%",
      color, fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 600,
      letterSpacing: "0.08em", textTransform: "uppercase",
      display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
      lineHeight: 1.2, padding: 6, opacity: 0.8,
    }}>
      <span>{children}</span>
    </div>
  );
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ borderTop: "4px solid var(--ink)", paddingTop: 12, marginBottom: 16 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>{num}</p>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontStyle: "italic", margin: "2px 0 0", lineHeight: 0.95, letterSpacing: "-0.02em", color: "var(--ink)" }}>{title}</h2>
    </div>
  );
}

function DashboardMobile({
  totalARS, totalUSD,
  deltaARSPct, deltaUSDPct,
  gastoSemana, promedioSemana4w,
  balanceMes, tasaAhorro,
  recentTransactions,
  mesLabel, diasRestantesMes,
}: {
  totalARS: number; totalUSD: number;
  deltaARSPct: number | null; deltaUSDPct: number | null;
  gastoSemana: number; promedioSemana4w: number | null;
  balanceMes: number; tasaAhorro: number | null;
  recentTransactions: RecentTransaction[];
  mesLabel: string; diasRestantesMes: number;
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

      {/* HERO — Tenés en pesos */}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>
        Tenés en pesos
      </p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 52, lineHeight: 1, margin: "4px 0 0", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", color: "var(--ink)", fontStyle: "italic" }}>
        {fmtARS(totalARS)}
      </p>
      {deltaARSPct !== null && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: deltaARSPct >= 0 ? "#586e3d" : "#c14a3a", margin: "4px 0 0", letterSpacing: "0.04em" }}>
          {deltaARSPct >= 0 ? "▲ +" : "▼ −"}{Math.abs(deltaARSPct).toFixed(0)}% · 30d
        </p>
      )}

      {/* USD secundario */}
      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>
          En dólares
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--ink)", margin: 0, fontVariantNumeric: "tabular-nums" }}>
            {fmtUSD(totalUSD)} <span style={{ fontSize: 10, color: "var(--ink3)" }}>USD</span>
          </p>
          {deltaUSDPct !== null && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: deltaUSDPct >= 0 ? "#586e3d" : "#c14a3a", letterSpacing: "0.04em" }}>
              {deltaUSDPct >= 0 ? "▲ +" : "▼ −"}{Math.abs(deltaUSDPct).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Esta semana */}
      <div style={{ marginTop: 24, padding: "14px 16px", background: "var(--paper2)", border: "1px solid var(--rule2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>
            Esta semana · gastaste
          </p>
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

      {/* Mes compacto */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink2)", margin: 0 }}>
          este mes vas{" "}
          <strong style={{ fontStyle: "normal", color: balanceMes >= 0 ? "#586e3d" : "#c14a3a" }}>
            {balanceMes >= 0 ? "+" : "−"} {fmtARS(Math.abs(balanceMes))}
          </strong>
        </p>
        {tasaAhorro !== null && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)" }}>
            {tasaAhorro.toFixed(0)}% ahorro
          </span>
        )}
      </div>

      {/* Últimos */}
      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, margin: "22px 0 4px", letterSpacing: "-0.02em" }}>Últimos</h2>
      {top4.map((t, i) => {
        const isExpense = t.type === "EXPENSE" || t.type === "STOCK_PURCHASE" || t.type === "CRYPTO_PURCHASE";
        const date = new Date(t.date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isToday = date.toDateString() === today.toDateString();
        const isYest = date.toDateString() === yesterday.toDateString();
        const timeStr = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(date);
        const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" }).format(date);
        const dateLabel = isToday ? `Hoy ${timeStr}` : isYest ? "Ayer" : weekday.charAt(0).toUpperCase() + weekday.slice(1);
        return (
          <Link key={t.id} href="/finanzas/transacciones" style={{ display: "block", textDecoration: "none" }}>
            <div style={{ padding: "11px 0", borderBottom: "1px dashed var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, margin: 0, color: "var(--ink)", lineHeight: 1.2 }}>
                  {t.description ?? t.category}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "2px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {dateLabel} · {t.category}
                </p>
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: isExpense ? "var(--ink)" : "#586e3d", margin: 0, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {isExpense ? "−" : "+"}{" "}
                {t.currency === "USD" ? `${fmtUSD(t.amount)} USD` : fmtARS(t.amount)}
              </p>
            </div>
          </Link>
        );
      })}
      <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, margin: "14px 0 0", textAlign: "center" }}>
        <Link href="/finanzas/transacciones" style={{ color: "var(--navy)", textDecoration: "none" }}>ver todos →</Link>
      </p>
    </div>
  );
}

export default function DashboardContent({
  mesYM,
  displayName,
  totalARS, walletsARSCount,
  foreignUSD, foreignAccountsCount,
  portfolioUSD, walletsUSD, investmentsCount, portfolioDayChange,
  ingresosMes, gastosMes, balanceMes, tasaAhorro,
  diffGastos, diffIngresos, mesLabel,
  gastadoHoy, txHoyCount,
  presupuestoTotal, presupuestoRestante, presupuestoPct, diasRestantesMes,
  proximoRecurrente,
  categoryData, categoryDataUSD, fixedExpensesARS, variableExpensesARS,
  incomeCategoryData, ingresosUSD, gastosUSD,
  monthlyData, wealthData,
  recentTransactions, budgetAlerts, sessionsToday,
  deltaARSPct, deltaUSDPct,
  gastoSemana, promedioSemana4w,
}: Props) {

  const totalUSD = walletsUSD + foreignUSD + portfolioUSD;

  // Holdings para mostrar distribución
  const arsHoldings: { name: string; amt: number; cur: string }[] = [];
  if (totalARS > 0) arsHoldings.push({ name: `Billeteras ARS (${walletsARSCount})`, amt: totalARS, cur: "ARS" });
  const usdHoldings: { name: string; amt: number; cur: string }[] = [];
  if (walletsUSD > 0) usdHoldings.push({ name: "Billeteras USD", amt: walletsUSD, cur: "USD" });
  if (foreignUSD > 0) usdHoldings.push({ name: `Cuentas ext. (${foreignAccountsCount})`, amt: foreignUSD, cur: "USD" });
  if (portfolioUSD > 0) usdHoldings.push({ name: `Portfolio (${investmentsCount} posic.)`, amt: portfolioUSD, cur: "USD" });

  const maxARS = Math.max(...arsHoldings.map((h) => h.amt), 1);
  const maxUSD = Math.max(...usdHoldings.map((h) => h.amt), 1);

  // Categorías con % de ingresos
  const catConPct = categoryData.map((c) => ({
    ...c,
    pct: ingresosMes > 0 ? (c.total / ingresosMes) * 100 : 0,
  }));
  const maxCat = Math.max(...catConPct.map((c) => c.total), 1);

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
        />
      </div>
      {/* ── Desktop ──────────────────────────────────────────────── */}
      <div className="hidden md:block">
      {/* ── Page header ──────────────────────────────────────────── */}
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, paddingBottom: 16, borderBottom: "1px solid var(--rule2)" }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>I · Patrimonio — {mesLabel}</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink)", margin: "4px 0 0", lineHeight: 0.95, fontStyle: "italic", letterSpacing: "-0.02em" }}>
            El estado de la cosa
          </h1>
        </div>
        <MonthFilter selected={mesYM} />
      </header>

      {/* ── Patrimonio: ARS + USD separados ──────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 32, marginBottom: 40 }}>

        {/* ARS block */}
        <div style={{ borderTop: "4px solid var(--ink)", paddingTop: 14, position: "relative" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>Capital · ARS</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1, margin: "6px 0 0", color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", fontWeight: 500 }}>
            {fmtARS(totalARS)}
          </p>
          {deltaARSPct !== null && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.04em", margin: "2px 0 0", color: deltaARSPct >= 0 ? "#586e3d" : "#c14a3a" }}>
              {deltaARSPct >= 0 ? "▲ +" : "▼ −"}{Math.abs(deltaARSPct).toFixed(0)}% · 30d
            </p>
          )}
          {diffIngresos !== null && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, margin: "6px 0 0", color: diffIngresos >= 0 ? "var(--olive)" : "var(--brick)" }}>
              {diffIngresos >= 0 ? "▲" : "▼"} {Math.abs(diffIngresos).toFixed(1)}% MoM
            </p>
          )}
          {arsHoldings.length > 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--rule2)", paddingTop: 12 }}>
              {arsHoldings.map((h, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", alignItems: "center", gap: 10, padding: "4px 0", borderBottom: i < arsHoldings.length - 1 ? "1px dashed var(--rule)" : "none" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink2)" }}>{h.name}</span>
                  <div style={{ height: 6, background: "var(--paper2)" }}>
                    <div style={{ height: "100%", width: `${(h.amt / maxARS) * 100}%`, background: "var(--ink)" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmtARS(h.amt)} <span style={{ color: "var(--ink3)", fontSize: 9 }}>ARS</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* USD block */}
        <div style={{ borderTop: "4px solid var(--ink)", paddingTop: 14 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>Capital · USD</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1, margin: "6px 0 0", color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", fontWeight: 500 }}>
            {fmtUSD(totalUSD)}
          </p>
          {deltaUSDPct !== null && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.04em", margin: "2px 0 0", color: deltaUSDPct >= 0 ? "#586e3d" : "#c14a3a" }}>
              {deltaUSDPct >= 0 ? "▲ +" : "▼ −"}{Math.abs(deltaUSDPct).toFixed(0)}% · 30d
            </p>
          )}
          {portfolioDayChange !== 0 && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, margin: "6px 0 0", color: portfolioDayChange >= 0 ? "var(--olive)" : "var(--brick)" }}>
              {portfolioDayChange >= 0 ? "▲" : "▼"} {fmtUSD(Math.abs(portfolioDayChange))} USD portfolio hoy
            </p>
          )}
          {usdHoldings.length > 0 ? (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--rule2)", paddingTop: 12 }}>
              {usdHoldings.map((h, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", alignItems: "center", gap: 10, padding: "4px 0", borderBottom: i < usdHoldings.length - 1 ? "1px dashed var(--rule)" : "none" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink2)" }}>{h.name}</span>
                  <div style={{ height: 6, background: "var(--paper2)" }}>
                    <div style={{ height: "100%", width: `${(h.amt / maxUSD) * 100}%`, background: "var(--ink)" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmtUSD(h.amt)} <span style={{ color: "var(--ink3)", fontSize: 9 }}>USD</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink3)", marginTop: 16 }}>Sin cuentas USD · <Link href="/finanzas/billeteras" style={{ color: "var(--navy)" }}>agregar →</Link></p>
          )}
        </div>
      </section>

      <WavyRule width={240} />

      {/* ── Mes actual KPIs ──────────────────────────────────────── */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader num="II · Movimientos" title={`Bitácora · ${mesLabel}`} />

        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 20, marginBottom: 20 }}>
          {[
            { label: "Ingresos ARS", value: fmtARS(ingresosMes), diff: diffIngresos, good: true, color: "var(--olive)" },
            { label: "Gastos ARS", value: fmtARS(gastosMes), diff: diffGastos, good: false, color: "var(--brick)" },
            { label: "Balance", value: (balanceMes >= 0 ? "+ " : "− ") + fmtARS(Math.abs(balanceMes)), diff: null, good: balanceMes >= 0, color: balanceMes >= 0 ? "var(--olive)" : "var(--brick)" },
            { label: "Tasa ahorro", value: tasaAhorro !== null ? tasaAhorro.toFixed(1) + "%" : "—", diff: null, good: tasaAhorro !== null && tasaAhorro >= 0, color: tasaAhorro !== null && tasaAhorro >= 20 ? "var(--olive)" : tasaAhorro !== null && tasaAhorro >= 0 ? "var(--rust)" : "var(--brick)" },
          ].map((k, i) => (
            <div key={i} style={{ borderTop: `2px solid ${k.color}`, paddingTop: 10 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>{k.label}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--ink)", margin: "4px 0 0", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{k.value}</p>
              {k.diff !== null && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, margin: "4px 0 0", color: (k.good ? k.diff <= 0 : k.diff >= 0) ? "var(--olive)" : "var(--brick)" }}>
                  {k.diff >= 0 ? "▲ +" : "▼ "}{k.diff.toFixed(0)}% vs mes ant.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Presupuesto */}
        {presupuestoPct !== null && (
          <div style={{ padding: "14px 16px", border: "1px solid var(--rule2)", background: "var(--paper2)", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Presupuesto del mes</p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <span style={{ color: "var(--ink3)" }}>{fmtARS(gastosMes)} <span style={{ fontSize: 9 }}>gastado</span></span>
                <span style={{ color: "var(--ink3)" }}>de {fmtARS(presupuestoTotal)}</span>
                <Link href="/finanzas/presupuesto" style={{ color: "var(--navy)", fontSize: 10 }}>detalle →</Link>
              </div>
            </div>
            <div style={{ height: 6, background: "var(--rule)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(presupuestoPct, 100)}%`, background: presupuestoPct > 100 ? "var(--brick)" : presupuestoPct > 80 ? "var(--rust)" : "var(--olive)" }} />
            </div>
            {budgetAlerts.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {budgetAlerts.map((a) => (
                  <span key={a.category} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: a.pct >= 100 ? "var(--brick)" : "var(--rust)", border: `1px solid ${a.pct >= 100 ? "var(--brick)" : "var(--rust)"}`, padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {a.category} {a.pct.toFixed(0)}%
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hoy strip */}
        {(gastadoHoy > 0 || sessionsToday.length > 0 || proximoRecurrente) && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {gastadoHoy > 0 && (
              <div style={{ borderLeft: "3px solid var(--ink)", paddingLeft: 12 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Gastado hoy</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--brick)", margin: "2px 0 0", fontVariantNumeric: "tabular-nums" }}>
                  {fmtARS(gastadoHoy)} <span style={{ color: "var(--ink3)", fontSize: 10 }}>· {txHoyCount} mov.</span>
                </p>
              </div>
            )}
            {sessionsToday.length > 0 && (
              <div style={{ borderLeft: "3px solid var(--navy)", paddingLeft: 12 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Sesión hoy</p>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)", margin: "2px 0 0", fontStyle: "italic" }}>{sessionsToday[0].clientName}</p>
              </div>
            )}
            {proximoRecurrente && (
              <div style={{ borderLeft: "3px solid var(--rust)", paddingLeft: 12 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Vence día {proximoRecurrente.dayOfMonth}
                </p>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)", margin: "2px 0 0", fontStyle: "italic" }}>{proximoRecurrente.description}</p>
              </div>
            )}
            {diasRestantesMes > 0 && (
              <div style={{ borderLeft: "3px solid var(--rule2)", paddingLeft: 12 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Quedan</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--ink)", margin: "2px 0 0" }}>{diasRestantesMes}d</p>
              </div>
            )}
          </div>
        )}
      </section>

      <WavyRule width={240} />

      {/* ── Distribución del gasto ───────────────────────────────── */}
      {(catConPct.length > 0 || categoryDataUSD.length > 0) && (
        <section style={{ marginBottom: 40 }}>
          <SectionHeader num="III · Gastos" title="Distribución del gasto" />

          {/* Fijos vs Variables */}
          {gastosMes > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Fijos vs Variables · ARS</span>
                <div style={{ display: "flex", gap: 16, fontFamily: "var(--font-mono)", fontSize: 10 }}>
                  <span style={{ color: "var(--ink3)" }}>Fijos: <span style={{ color: "var(--ink)" }}>{fmtARS(fixedExpensesARS)}</span></span>
                  <span style={{ color: "var(--ink3)" }}>Variables: <span style={{ color: "var(--ink)" }}>{fmtARS(variableExpensesARS)}</span></span>
                </div>
              </div>
              <div style={{ height: 6, background: "var(--paper2)", display: "flex" }}>
                <div style={{ height: "100%", width: `${(fixedExpensesARS / gastosMes) * 100}%`, background: "var(--rust)" }} />
                <div style={{ height: "100%", flex: 1, background: "var(--brick)" }} />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, background: "var(--rust)", display: "inline-block" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink3)", letterSpacing: "0.06em" }}>FIJOS {gastosMes > 0 ? ((fixedExpensesARS / gastosMes) * 100).toFixed(0) : 0}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, background: "var(--brick)", display: "inline-block" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--ink3)", letterSpacing: "0.06em" }}>VARIABLES {gastosMes > 0 ? ((variableExpensesARS / gastosMes) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            </div>
          )}

          {/* ARS por categoría */}
          {catConPct.length > 0 && (
            <>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Por categoría · ARS · % sobre ingresos
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "0 32px", marginBottom: categoryDataUSD.length > 0 ? 20 : 0 }}>
                {catConPct.map((c, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px dashed var(--rule)", display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: "0 10px" }}>
                    <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", gridColumn: "1 / -1" }} className="lg:col-span-1">{c.category}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtARS(c.total)}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right", color: c.pct > 30 ? "var(--brick)" : c.pct > 15 ? "var(--rust)" : "var(--ink3)", fontVariantNumeric: "tabular-nums" }}>{c.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* USD por categoría */}
          {categoryDataUSD.length > 0 && (
            <>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Por categoría · USD · total {fmtUSD(gastosUSD)} USD
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "0 32px" }}>
                {categoryDataUSD.map((c, i) => {
                  const maxUSDCat = Math.max(...categoryDataUSD.map((x) => x.total), 1);
                  return (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px dashed var(--rule)", display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: "0 10px" }}>
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", gridColumn: "1 / -1" }} className="lg:col-span-1">{c.category}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtUSD(c.total)} <span style={{ fontSize: 9, color: "var(--ink3)" }}>USD</span></span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right", color: "var(--ink3)", fontVariantNumeric: "tabular-nums" }}>{((c.total / maxUSDCat) * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {ingresosMes > 0 && (
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink3)", margin: "12px 0 0" }}>
              Total gastado ARS: {((gastosMes / ingresosMes) * 100).toFixed(0)}% de ingresos.{" "}
              {gastosMes / ingresosMes > 0.9 ? "Zona roja." : gastosMes / ingresosMes > 0.7 ? "Margen ajustado." : "Margen saludable."}
            </p>
          )}
        </section>
      )}

      <WavyRule width={240} />

      {/* ── Distribución de ganancias ────────────────────────────── */}
      {incomeCategoryData.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <SectionHeader num="IV · Ingresos" title="Distribución de ganancias" />

          {/* Resumen ARS + USD */}
          <div style={{ display: "flex", gap: 32, marginBottom: 20 }}>
            <div style={{ borderLeft: "3px solid var(--olive)", paddingLeft: 12 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Total ARS</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--olive)", margin: "2px 0 0", fontVariantNumeric: "tabular-nums" }}>{fmtARS(ingresosMes)}</p>
            </div>
            {ingresosUSD > 0 && (
              <div style={{ borderLeft: "3px solid var(--navy)", paddingLeft: 12 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Total USD</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--navy)", margin: "2px 0 0", fontVariantNumeric: "tabular-nums" }}>{fmtUSD(ingresosUSD)} <span style={{ fontSize: 10 }}>USD</span></p>
              </div>
            )}
          </div>

          {/* Por categoría */}
          <div style={{ borderTop: "1px solid var(--rule2)" }}>
            {incomeCategoryData.map((c, i) => (
              <div key={i} style={{ padding: "9px 0", borderBottom: "1px dashed var(--rule)", display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: "0 12px" }}>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)" }}>{c.category}</span>
                {c.ars > 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--olive)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmtARS(c.ars)} <span style={{ fontSize: 9, color: "var(--ink3)" }}>ARS</span>
                  </span>
                )}
                {c.usd > 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--navy)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmtUSD(c.usd)} <span style={{ fontSize: 9, color: "var(--ink3)" }}>USD</span>
                  </span>
                )}
                {c.ars === 0 && <span />}
                {c.usd === 0 && <span />}
              </div>
            ))}
          </div>
        </section>
      )}

      <WavyRule width={240} />

      {/* ── Últimas transacciones — ledger style ─────────────────── */}
      {recentTransactions.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
            <SectionHeader num="V · Asientos" title="Últimos movimientos" />
            <Link href="/finanzas/transacciones" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--navy)", textDecoration: "none" }}>ver todos →</Link>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)" }}>
            <tbody>
              {recentTransactions.map((t, i) => {
                const isExpense = t.type === "EXPENSE" || t.type === "STOCK_PURCHASE" || t.type === "CRYPTO_PURCHASE";
                return (
                  <tr key={t.id} style={{ borderBottom: i === 0 ? "1px solid var(--ink)" : "1px dashed var(--rule)" }}>
                    <td style={{ padding: "8px 0", fontSize: 10, color: "var(--ink3)", letterSpacing: "0.06em", width: 80 }}>
                      {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(t.date)).toUpperCase()}
                    </td>
                    <td style={{ padding: "8px 0", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", flex: 1 }}>
                      {t.description ?? t.category}
                    </td>
                    <td style={{ padding: "8px 0", fontSize: 9, color: "var(--ink3)", letterSpacing: "0.1em", textTransform: "uppercase", width: 120 }}>
                      {t.category}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontSize: 14, color: isExpense ? "var(--ink)" : "var(--olive)", fontVariantNumeric: "tabular-nums", width: 140 }}>
                      {isExpense ? "−" : "+"}{" "}
                      {t.currency === "USD" ? `${fmtUSD(t.amount)} USD` : `${fmtARS(t.amount)} ARS`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Gráficos ─────────────────────────────────────────────── */}
      {(monthlyData.some((m) => m.ingresos > 0 || m.gastos > 0) || wealthData.length >= 2) && (
        <section style={{ marginBottom: 40 }}>
          <SectionHeader num="VI · Evolución" title="Histórico" />
          <div style={{ display: "grid", gridTemplateColumns: wealthData.length >= 2 ? "1fr 1fr" : "1fr", gap: 32 }}>
            {monthlyData.some((m) => m.ingresos > 0 || m.gastos > 0) && (
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 16px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Ingresos vs Gastos · 6 meses · ARS</p>
                <MonthlyChart data={monthlyData} />
              </div>
            )}
            {wealthData.length >= 2 && (
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 16px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Evolución patrimonial</p>
                <WealthChart data={wealthData} />
              </div>
            )}
          </div>
        </section>
      )}
      </div>{/* end desktop */}
    </div>
  );
}
