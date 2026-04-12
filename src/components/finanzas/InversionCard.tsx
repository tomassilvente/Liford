"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InvestmentModel as Investment } from "@/generated/prisma/models";
import type { Cotizacion } from "@/lib/cotizaciones";
import PriceHistoryChart from "./PriceHistoryChart";

interface InversionCardProps {
  investment: Investment;
  cotizacion: Cotizacion | null;
}

function fmt(n: number, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function fmtNum(n: number, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

const MARKET_STATE_LABEL: Record<string, string> = {
  REGULAR: "Mercado abierto",
  PRE: "Pre-market",
  POST: "Post-market",
  CLOSED: "Mercado cerrado",
};

export default function InversionCard({ investment, cotizacion }: InversionCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [quantity, setQuantity] = useState(String(investment.quantity));
  const [avgBuyPrice, setAvgBuyPrice] = useState(String(investment.avgBuyPrice));
  const [name, setName] = useState(investment.name ?? "");
  const [loading, setLoading] = useState(false);

  const cp = cotizacion?.price ?? null;
  const costoBasis = investment.quantity * investment.avgBuyPrice;
  const valorActual = cp !== null ? investment.quantity * cp : null;
  const pnl = valorActual !== null ? valorActual - costoBasis : null;
  const pnlPct = pnl !== null ? (pnl / costoBasis) * 100 : null;

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/finanzas/inversiones/${investment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity, avgBuyPrice }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar ${investment.ticker} del portfolio?`)) return;
    await fetch(`/api/finanzas/inversiones/${investment.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editing) {
    return (
      <div className="rounded-xl bg-neutral-800 p-5 ring-1 ring-blue-500">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-neutral-500">{investment.type === "STOCK" ? "📈" : "🪙"}</span>
          <p className="font-bold text-white">{investment.ticker}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Coca-Cola"
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Cantidad</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0.000001" step="any"
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Precio promedio de compra (USD)</label>
            <input type="number" value={avgBuyPrice} onChange={(e) => setAvgBuyPrice(e.target.value)} min="0.000001" step="any"
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              Guardar
            </button>
            <button onClick={() => setEditing(false)}
              className="rounded-lg bg-neutral-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-600">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-neutral-800">
      {/* Header */}
      <div className="group p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">{investment.type === "STOCK" ? "📈" : "🪙"}</span>
              <p className="font-bold text-white">{investment.ticker}</p>
              {investment.name && <span className="text-xs text-neutral-500">{investment.name}</span>}
              {cotizacion?.marketState && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                  cotizacion.marketState === "REGULAR" ? "bg-green-900 text-green-400" : "bg-neutral-700 text-neutral-400"
                }`}>
                  {MARKET_STATE_LABEL[cotizacion.marketState] ?? cotizacion.marketState}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {fmtNum(investment.quantity, 6)} u. · Compra prom: {fmt(investment.avgBuyPrice)}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={() => setEditing(true)}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white" title="Editar">✏️</button>
            <button onClick={handleDelete}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-red-400" title="Eliminar">🗑️</button>
          </div>
        </div>

        {/* Precio + variación diaria */}
        <div className="mt-3 flex items-end gap-3">
          <p className="text-2xl font-bold text-white">
            {valorActual !== null ? fmt(valorActual) : "—"}
          </p>
          {cotizacion?.changePct !== null && cotizacion?.changePct !== undefined && (
            <div className={`mb-0.5 flex items-center gap-1 text-sm font-medium ${
              cotizacion.changePct >= 0 ? "text-green-400" : "text-red-400"
            }`}>
              <span>{cotizacion.changePct >= 0 ? "▲" : "▼"}</span>
              <span>{cotizacion.changePct >= 0 ? "+" : ""}{cotizacion.changePct.toFixed(2)}%</span>
              {cotizacion.changeAmount !== null && (
                <span className="text-xs text-neutral-500">
                  ({cotizacion.changeAmount >= 0 ? "+" : ""}{fmt(cotizacion.changeAmount)})
                </span>
              )}
            </div>
          )}
        </div>

        {/* P&L de la posición */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-neutral-900 px-3 py-2">
            <p className="text-xs text-neutral-500">Valor actual</p>
            
            <p className="mt-0.5 text-sm font-semibold text-white">
              {cp !== null ? fmt(cp) : "—"}</p>
          </div>
          <div className="rounded-lg bg-neutral-900 px-3 py-2">
            <p className="text-xs text-neutral-500">Invertido</p>
            <p className="mt-0.5 text-sm text-neutral-300">{fmt(costoBasis)}</p>
          </div>
          <div className="col-span-2 rounded-lg bg-neutral-900 px-3 py-2">
            <p className="text-xs text-neutral-500">P&L de tu posición</p>
            {pnl !== null ? (
              <p className={`mt-0.5 text-sm font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {pnl >= 0 ? "+" : ""}{fmt(pnl)}{" "}
                <span className="font-normal">({pnlPct! >= 0 ? "+" : ""}{pnlPct!.toFixed(2)}%)</span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-neutral-500">—</p>
            )}
          </div>
        </div>

        {/* Toggle detalles */}
        {!cotizacion?.error && cp !== null && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 w-full rounded-lg py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {expanded ? "▲ Ocultar detalles" : "▼ Ver más detalles"}
          </button>
        )}
      </div>

      {/* Detalles expandidos */}
      {expanded && cotizacion && (
        <div className="border-t border-neutral-700 px-5 pb-5 pt-4">
          <PriceHistoryChart ticker={investment.ticker} currentPrice={cp} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="text-xs text-neutral-500">Cierre anterior</p>
              <p className="mt-0.5 text-sm text-white">
                {cotizacion.previousClose !== null ? fmt(cotizacion.previousClose) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Exchange</p>
              <p className="mt-0.5 text-sm text-white">{cotizacion.exchangeName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Máximo del día</p>
              <p className="mt-0.5 text-sm text-green-400">
                {cotizacion.dayHigh !== null ? fmt(cotizacion.dayHigh) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Mínimo del día</p>
              <p className="mt-0.5 text-sm text-red-400">
                {cotizacion.dayLow !== null ? fmt(cotizacion.dayLow) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Máx. 52 semanas</p>
              <p className="mt-0.5 text-sm text-green-400">
                {cotizacion.week52High !== null ? fmt(cotizacion.week52High) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Mín. 52 semanas</p>
              <p className="mt-0.5 text-sm text-red-400">
                {cotizacion.week52Low !== null ? fmt(cotizacion.week52Low) : "—"}
              </p>
            </div>

            {/* Distancia al máx/mín de 52 sem */}
            {cotizacion.week52High !== null && cp !== null && (
              <div className="col-span-2">
                <p className="mb-1 text-xs text-neutral-500">Posición en rango de 52 semanas</p>
                <div className="relative h-1.5 w-full rounded-full bg-neutral-700">
                  <div
                    className="absolute left-0 h-1.5 rounded-full bg-blue-500"
                    style={{
                      width: `${Math.min(100, Math.max(0,
                        ((cp - (cotizacion.week52Low ?? 0)) /
                          ((cotizacion.week52High - (cotizacion.week52Low ?? 0)) || 1)) * 100
                      ))}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-neutral-600">
                  <span>{cotizacion.week52Low !== null ? fmt(cotizacion.week52Low) : "—"}</span>
                  <span>{fmt(cotizacion.week52High)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {cotizacion?.error && (
        <p className="px-5 pb-4 text-xs text-yellow-600">Sin cotización — revisá el ticker</p>
      )}
    </div>
  );
}
