export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { fetchCotizaciones } from "@/lib/cotizaciones";
import { requireSession } from "@/lib/auth";
import InversionCard from "@/components/finanzas/InversionCard";
import InversionForm from "@/components/finanzas/InversionForm";
import PortfolioAllocationChart from "@/components/finanzas/PortfolioAllocationChart";

export default async function InversionesPage() {
  const { userId } = await requireSession();
  const inversiones = await db.investment.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  const tickers = inversiones.map((i) => i.ticker);
  const cotizaciones = await fetchCotizaciones(tickers);

  let totalInvertido = 0;
  let totalActual = 0;
  let hayPrecios = false;

  for (const inv of inversiones) {
    const costo = inv.quantity * inv.avgBuyPrice;
    totalInvertido += costo;
    const precio = cotizaciones[inv.ticker]?.price;
    if (precio !== null && precio !== undefined) {
      totalActual += inv.quantity * precio;
      hayPrecios = true;
    }
  }

  const pnlTotal = totalActual - totalInvertido;
  const pnlPct = totalInvertido > 0 ? (pnlTotal / totalInvertido) * 100 : 0;

  function fmt(n: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ borderTop: "4px solid var(--ink)", paddingTop: 12, marginBottom: 24 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>III · Portfolio</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontStyle: "italic", color: "var(--ink)", margin: "4px 0 0", lineHeight: 0.95, letterSpacing: "-0.02em" }}>Inversiones</h1>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink2)", marginTop: 6, fontStyle: "italic" }}>Tu portfolio de acciones y crypto en USD</p>
      </div>

      {/* Resumen del portfolio */}
      {inversiones.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: "12px 16px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Invertido</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>{fmt(totalInvertido)}</p>
          </div>
          <div style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: "12px 16px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Valor actual</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>
              {hayPrecios ? fmt(totalActual) : "—"}
            </p>
          </div>
          <div style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: "12px 16px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>P&L total</p>
            {hayPrecios ? (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: pnlTotal >= 0 ? "var(--olive)" : "var(--brick)", marginTop: 4 }}>
                {pnlTotal >= 0 ? "+" : ""}{fmt(pnlTotal)}
              </p>
            ) : (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--ink3)", marginTop: 4 }}>—</p>
            )}
          </div>
          <div style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: "12px 16px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Rendimiento</p>
            {hayPrecios ? (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: pnlPct >= 0 ? "var(--olive)" : "var(--brick)", marginTop: 4 }}>
                {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
              </p>
            ) : (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--ink3)", marginTop: 4 }}>—</p>
            )}
          </div>
        </div>
      )}

      {/* Pie chart de distribución */}
      {hayPrecios && inversiones.length > 1 && (
        <div className="mt-6">
          <PortfolioAllocationChart
            items={inversiones.map((inv) => ({
              ticker: inv.ticker,
              name: inv.name,
              value: inv.quantity * (cotizaciones[inv.ticker]?.price ?? inv.avgBuyPrice),
            }))}
          />
        </div>
      )}

      {/* Cards del portfolio */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {inversiones.map((inv) => (
          <InversionCard
            key={inv.id}
            investment={inv}
            cotizacion={cotizaciones[inv.ticker] ?? null}
          />
        ))}
        <InversionForm />
      </div>

      {inversiones.length > 0 && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", marginTop: 16 }}>
          Precios actualizados cada 5 min · Fuente: Yahoo Finance
        </p>
      )}
    </div>
  );
}
