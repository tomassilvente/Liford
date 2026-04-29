"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuPencil, LuTrash2, LuTrendingUp, LuCoins, LuArrowUp, LuArrowDown } from "react-icons/lu";
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

const inputStyle: React.CSSProperties = {
  background: "var(--paper)",
  border: "1px solid var(--rule2)",
  fontFamily: "var(--font-serif)",
  fontSize: 14,
  color: "var(--ink)",
  padding: "6px 10px",
  outline: "none",
  width: "100%",
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
      <div style={{ background: "var(--paper2)", border: "1px solid var(--ink)", padding: 20 }}>
        <div className="mb-3 flex items-center gap-2">
          {investment.type === "STOCK" ? <LuTrendingUp size={14} style={{ color: "var(--ink3)" }} /> : <LuCoins size={14} style={{ color: "var(--ink3)" }} />}
          <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{investment.ticker}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", display: "block", marginBottom: 4 }}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Coca-Cola" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", display: "block", marginBottom: 4 }}>Cantidad</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0.000001" step="any" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", display: "block", marginBottom: 4 }}>Precio promedio de compra (USD)</label>
            <input type="number" value={avgBuyPrice} onChange={(e) => setAvgBuyPrice(e.target.value)} min="0.000001" step="any" style={inputStyle} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading}
              style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "8px 16px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
              Guardar
            </button>
            <button onClick={() => setEditing(false)}
              style={{ background: "var(--paper3)", color: "var(--ink2)", border: "1px solid var(--rule2)", padding: "8px 16px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--paper2)", border: "1px solid var(--rule2)" }}>
      <div className="group p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {investment.type === "STOCK"
                ? <LuTrendingUp size={14} style={{ color: "var(--ink3)" }} />
                : <LuCoins size={14} style={{ color: "var(--ink3)" }} />
              }
              <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{investment.ticker}</p>
              {investment.name && <span style={{ fontFamily: "var(--font-serif)", fontSize: 11, color: "var(--ink3)" }}>{investment.name}</span>}
              {cotizacion?.marketState && (
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "2px 6px",
                  background: cotizacion.marketState === "REGULAR" ? "var(--olive)" : "var(--paper3)",
                  color: cotizacion.marketState === "REGULAR" ? "var(--paper)" : "var(--ink3)",
                }}>
                  {MARKET_STATE_LABEL[cotizacion.marketState] ?? cotizacion.marketState}
                </span>
              )}
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", marginTop: 4 }}>
              {fmtNum(investment.quantity, 6)} u. · Compra prom: {fmt(investment.avgBuyPrice)}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)}
              style={{ color: "var(--ink3)", background: "none", border: "none", cursor: "pointer", padding: 4 }} title="Editar">
              <LuPencil size={14} />
            </button>
            <button onClick={handleDelete}
              style={{ color: "var(--ink3)", background: "none", border: "none", cursor: "pointer", padding: 4 }} title="Eliminar">
              <LuTrash2 size={14} />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-end gap-3">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
            {valorActual !== null ? fmt(valorActual) : "—"}
          </p>
          {cotizacion?.changePct !== null && cotizacion?.changePct !== undefined && (
            <div className="mb-0.5 flex items-center gap-1" style={{ color: cotizacion.changePct >= 0 ? "var(--olive)" : "var(--brick)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>
              {cotizacion.changePct >= 0
                ? <LuArrowUp size={13} />
                : <LuArrowDown size={13} />
              }
              <span>{cotizacion.changePct >= 0 ? "+" : ""}{cotizacion.changePct.toFixed(2)}%</span>
              {cotizacion.changeAmount !== null && (
                <span style={{ fontSize: 10, color: "var(--ink3)", fontWeight: 400 }}>
                  ({cotizacion.changeAmount >= 0 ? "+" : ""}{fmt(cotizacion.changeAmount)})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div style={{ background: "var(--paper3)", padding: "8px 12px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink3)" }}>Valor actual</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>
              {cp !== null ? fmt(cp) : "—"}
            </p>
          </div>
          <div style={{ background: "var(--paper3)", padding: "8px 12px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink3)" }}>Invertido</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink2)", marginTop: 2 }}>{fmt(costoBasis)}</p>
          </div>
          <div className="col-span-2" style={{ background: "var(--paper3)", padding: "8px 12px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink3)" }}>P&L de tu posición</p>
            {pnl !== null ? (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: pnl >= 0 ? "var(--olive)" : "var(--brick)", marginTop: 2 }}>
                {pnl >= 0 ? "+" : ""}{fmt(pnl)}{" "}
                <span style={{ fontWeight: 400, color: "var(--ink3)" }}>({pnlPct! >= 0 ? "+" : ""}{pnlPct!.toFixed(2)}%)</span>
              </p>
            ) : (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink3)", marginTop: 2 }}>—</p>
            )}
          </div>
        </div>

        {!cotizacion?.error && cp !== null && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ marginTop: 12, width: "100%", background: "none", border: "none", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--ink3)", cursor: "pointer", padding: "6px 0" }}
          >
            {expanded ? "▲ Ocultar detalles" : "▼ Ver más detalles"}
          </button>
        )}
      </div>

      {expanded && cotizacion && (
        <div style={{ borderTop: "1px solid var(--rule2)", padding: "16px 20px 20px" }}>
          <PriceHistoryChart ticker={investment.ticker} currentPrice={cp} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { label: "Cierre anterior", value: cotizacion.previousClose !== null ? fmt(cotizacion.previousClose) : "—", color: "var(--ink)" },
              { label: "Exchange", value: cotizacion.exchangeName ?? "—", color: "var(--ink)" },
              { label: "Máximo del día", value: cotizacion.dayHigh !== null ? fmt(cotizacion.dayHigh) : "—", color: "var(--olive)" },
              { label: "Mínimo del día", value: cotizacion.dayLow !== null ? fmt(cotizacion.dayLow) : "—", color: "var(--brick)" },
              { label: "Máx. 52 semanas", value: cotizacion.week52High !== null ? fmt(cotizacion.week52High) : "—", color: "var(--olive)" },
              { label: "Mín. 52 semanas", value: cotizacion.week52Low !== null ? fmt(cotizacion.week52Low) : "—", color: "var(--brick)" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink3)" }}>{label}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color, marginTop: 2 }}>{value}</p>
              </div>
            ))}

            {cotizacion.week52High !== null && cp !== null && (
              <div className="col-span-2">
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 4 }}>Posición en rango de 52 semanas</p>
                <div style={{ position: "relative", height: 6, width: "100%", background: "var(--paper3)" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      height: 6,
                      background: "var(--navy)",
                      width: `${Math.min(100, Math.max(0,
                        ((cp - (cotizacion.week52Low ?? 0)) /
                          ((cotizacion.week52High - (cotizacion.week52Low ?? 0)) || 1)) * 100
                      ))}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)" }}>
                  <span>{cotizacion.week52Low !== null ? fmt(cotizacion.week52Low) : "—"}</span>
                  <span>{fmt(cotizacion.week52High)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {cotizacion?.error && (
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 11, fontStyle: "italic", color: "var(--rust)", padding: "0 20px 16px" }}>Sin cotización — revisá el ticker</p>
      )}
    </div>
  );
}
