export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { fetchCotizaciones } from "@/lib/cotizaciones";
import InversionCard from "@/components/finanzas/InversionCard";
import InversionForm from "@/components/finanzas/InversionForm";
import PortfolioAllocationChart from "@/components/finanzas/PortfolioAllocationChart";

export default async function InversionesPage() {
  const inversiones = await db.investment.findMany({ orderBy: { createdAt: "asc" } });

  const tickers = inversiones.map((i) => i.ticker);
  const cotizaciones = await fetchCotizaciones(tickers);

  // Totales
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
      <h1 className="text-2xl font-bold text-white">Inversiones</h1>
      <p className="mt-1 text-neutral-400">Tu portfolio de acciones y crypto en USD</p>

      {/* Resumen del portfolio */}
      {inversiones.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-neutral-800 px-4 py-3">
            <p className="text-xs text-neutral-400">Invertido</p>
            <p className="mt-1 text-lg font-bold text-white">{fmt(totalInvertido)}</p>
          </div>
          <div className="rounded-xl bg-neutral-800 px-4 py-3">
            <p className="text-xs text-neutral-400">Valor actual</p>
            <p className="mt-1 text-lg font-bold text-white">
              {hayPrecios ? fmt(totalActual) : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-800 px-4 py-3">
            <p className="text-xs text-neutral-400">P&L total</p>
            {hayPrecios ? (
              <p className={`mt-1 text-lg font-bold ${pnlTotal >= 0 ? "text-green-400" : "text-red-400"}`}>
                {pnlTotal >= 0 ? "+" : ""}{fmt(pnlTotal)}
              </p>
            ) : (
              <p className="mt-1 text-lg font-bold text-neutral-500">—</p>
            )}
          </div>
          <div className="rounded-xl bg-neutral-800 px-4 py-3">
            <p className="text-xs text-neutral-400">Rendimiento</p>
            {hayPrecios ? (
              <p className={`mt-1 text-lg font-bold ${pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
              </p>
            ) : (
              <p className="mt-1 text-lg font-bold text-neutral-500">—</p>
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
        <p className="mt-4 text-xs text-neutral-600">
          Precios actualizados cada 5 min · Fuente: Yahoo Finance
        </p>
      )}
    </div>
  );
}
