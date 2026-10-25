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

  let totalInvertidoUSD = 0, totalActualUSD = 0, hayPreciosUSD = false;
  let totalInvertidoARS = 0, totalActualARS = 0, hayPreciosARS = false;

  for (const inv of inversiones) {
    const costo = inv.quantity * inv.avgBuyPrice;
    const precio = cotizaciones[inv.ticker]?.price;
    const invCurrency = inv.currency ?? cotizaciones[inv.ticker]?.currency ?? "USD";

    if (invCurrency === "ARS") {
      totalInvertidoARS += costo;
      if (precio !== null && precio !== undefined) { totalActualARS += inv.quantity * precio; hayPreciosARS = true; }
    } else {
      totalInvertidoUSD += costo;
      if (precio !== null && precio !== undefined) { totalActualUSD += inv.quantity * precio; hayPreciosUSD = true; }
    }
  }

  const pnlUSD = totalActualUSD - totalInvertidoUSD;
  const pnlPctUSD = totalInvertidoUSD > 0 ? (pnlUSD / totalInvertidoUSD) * 100 : 0;
  const pnlARS = totalActualARS - totalInvertidoARS;
  const pnlPctARS = totalInvertidoARS > 0 ? (pnlARS / totalInvertidoARS) * 100 : 0;

  function fmtUSD(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
  }
  function fmtARS(n: number) {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  }

  const usdInversiones = inversiones.filter((inv) => (inv.currency ?? cotizaciones[inv.ticker]?.currency ?? "USD") !== "ARS");
  const arsInversiones = inversiones.filter((inv) => (inv.currency ?? cotizaciones[inv.ticker]?.currency ?? "USD") === "ARS");

  return (
    <div>
      {/* Page header */}
      <div style={{ borderTop: "4px solid var(--ink)", paddingTop: 12, marginBottom: 24 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>III · Portfolio</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontStyle: "italic", color: "var(--ink)", margin: "4px 0 0", lineHeight: 0.95, letterSpacing: "-0.02em" }}>Inversiones</h1>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink2)", marginTop: 6, fontStyle: "italic" }}>Acciones, crypto y CEDEARs</p>
      </div>

      {/* Portfolio USD */}
      {usdInversiones.length > 0 && (
        <>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "var(--ink3)", margin: "0 0 10px", textTransform: "uppercase" }}>Portfolio USD</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ marginBottom: 20 }}>
            {[
              { label: "Invertido", value: fmtUSD(totalInvertidoUSD) },
              { label: "Valor actual", value: hayPreciosUSD ? fmtUSD(totalActualUSD) : "—" },
              { label: "P&L", value: hayPreciosUSD ? `${pnlUSD >= 0 ? "+" : ""}${fmtUSD(pnlUSD)}` : "—", color: hayPreciosUSD ? (pnlUSD >= 0 ? "var(--olive)" : "var(--brick)") : "var(--ink3)" },
              { label: "Rendimiento", value: hayPreciosUSD ? `${pnlPctUSD >= 0 ? "+" : ""}${pnlPctUSD.toFixed(2)}%` : "—", color: hayPreciosUSD ? (pnlPctUSD >= 0 ? "var(--olive)" : "var(--brick)") : "var(--ink3)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: "12px 16px" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>{label}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: color ?? "var(--ink)", marginTop: 4 }}>{value}</p>
              </div>
            ))}
          </div>
          {hayPreciosUSD && usdInversiones.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <PortfolioAllocationChart
                items={usdInversiones.map((inv) => ({
                  ticker: inv.ticker,
                  name: inv.name,
                  value: inv.quantity * (cotizaciones[inv.ticker]?.price ?? inv.avgBuyPrice),
                }))}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: 32 }}>
            {usdInversiones.map((inv) => (
              <InversionCard key={inv.id} investment={inv} cotizacion={cotizaciones[inv.ticker] ?? null} />
            ))}
          </div>
        </>
      )}

      {/* Portfolio ARS (CEDEARs) */}
      {arsInversiones.length > 0 && (
        <>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "var(--ink3)", margin: "0 0 10px", textTransform: "uppercase" }}>Portfolio ARS — CEDEARs</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ marginBottom: 20 }}>
            {[
              { label: "Invertido", value: fmtARS(totalInvertidoARS) },
              { label: "Valor actual", value: hayPreciosARS ? fmtARS(totalActualARS) : "—" },
              { label: "P&L", value: hayPreciosARS ? `${pnlARS >= 0 ? "+" : ""}${fmtARS(pnlARS)}` : "—", color: hayPreciosARS ? (pnlARS >= 0 ? "var(--olive)" : "var(--brick)") : "var(--ink3)" },
              { label: "Rendimiento", value: hayPreciosARS ? `${pnlPctARS >= 0 ? "+" : ""}${pnlPctARS.toFixed(2)}%` : "—", color: hayPreciosARS ? (pnlPctARS >= 0 ? "var(--olive)" : "var(--brick)") : "var(--ink3)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: "12px 16px" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>{label}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: color ?? "var(--ink)", marginTop: 4 }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: 32 }}>
            {arsInversiones.map((inv) => (
              <InversionCard key={inv.id} investment={inv} cotizacion={cotizaciones[inv.ticker] ?? null} />
            ))}
          </div>
        </>
      )}

      {/* Nueva inversión */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
