"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuX, LuCopy, LuTrash2, LuCheck, LuPencil } from "react-icons/lu";
import { toast } from "sonner";
import { catIcon, type TxRowData, type CatData } from "./MovementRow";

const FALLBACK_GASTO   = ["Alimentación","Transporte","Entretenimiento","Salud","Servicios","Ropa","Educación","Suscripciones","Otro"];
const FALLBACK_INGRESO = ["Sueldo","Freelance","Fotografía","Venta","Inversión","Transferencia recibida","Reembolso","Otro"];

function fmtBig(n: number, currency: string) {
  if (currency === "ARS")
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

interface Props {
  tx: TxRowData;
  userCategories: CatData[];
  catMap: Map<string, CatData>;
  catTotal: number;
  totalOut: number;
  onClose: () => void;
}

const labelSt: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 9,
  letterSpacing: "0.12em", textTransform: "uppercase" as const,
  color: "var(--ink3)",
};

const inputSt: React.CSSProperties = {
  background: "var(--paper)", border: "1px solid var(--ink)",
  padding: "5px 8px", fontFamily: "var(--font-serif)",
  fontSize: 13, color: "var(--ink)", outline: "none", width: "100%",
};

type EditField = "category" | "amount" | "date" | null;

export default function DetailPanel({ tx, userCategories, catMap, catTotal, totalOut, onClose }: Props) {
  const router = useRouter();
  const isExpense = tx.type !== "INCOME";
  const isPhoto = tx.source === "PHOTOGRAPHY";
  const cat = catMap.get(tx.category);

  const [editField, setEditField] = useState<EditField>(null);
  const [cat_, setCat]   = useState(tx.category);
  const [amt_, setAmt]   = useState(String(tx.amount));
  const [date_, setDate] = useState(tx.date.slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const catsForType = userCategories
    .filter(c => isExpense ? c.type === "EXPENSE" || c.type === "BOTH" : c.type === "INCOME" || c.type === "BOTH")
    .map(c => c.name);
  const fallback = isExpense ? FALLBACK_GASTO : FALLBACK_INGRESO;
  const catsList = catsForType.length > 0 ? catsForType : fallback;
  const catsWithCurrent = catsList.includes(cat_) ? catsList : [cat_, ...catsList];

  async function save(field: EditField) {
    setLoading(true);
    const body: Record<string, unknown> = {};
    if (field === "category") body.category = cat_;
    if (field === "amount")   body.amount = amt_;
    if (field === "date")     body.date = date_;
    const res = await fetch(`/api/finanzas/transactions/${tx.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) { toast.success("Guardado"); setEditField(null); router.refresh(); }
    else toast.error("No se pudo guardar");
  }

  async function handleDelete() {
    const res = await fetch(`/api/finanzas/transactions/${tx.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminada"); onClose(); router.refresh(); }
    else toast.error("No se pudo eliminar");
  }

  async function handleDuplicate() {
    const today = new Date().toLocaleDateString("en-CA");
    const res = await fetch("/api/finanzas/transactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: tx.type, amount: tx.amount, currency: tx.currency,
        category: tx.category, description: tx.description,
        source: "PERSONAL", date: today,
      }),
    });
    if (res.ok) { toast.success("Duplicada para hoy"); router.refresh(); }
    else toast.error("No se pudo duplicar");
  }

  const catPct = totalOut > 0 ? Math.round((catTotal / totalOut) * 100) : 0;

  return (
    <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Close + label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ ...labelSt }}>Detalles</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer", padding: 2 }}>
          <LuX size={14} />
        </button>
      </div>

      {/* Icon + name + amount */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, border: `1.5px solid ${cat?.color ?? "var(--rule2)"}`,
          background: "var(--paper2)", userSelect: "none",
        }}>
          {catIcon(cat, tx.category)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 600, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tx.description || tx.category}
          </p>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700,
            color: isExpense ? "var(--brick)" : "var(--olive)",
            fontVariantNumeric: "tabular-nums", margin: "3px 0 0", lineHeight: 1,
          }}>
            {isExpense ? "−" : "+"}&thinsp;{fmtBig(tx.amount, tx.currency)}
          </p>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--rule2)", marginBottom: 16 }} />

      {/* Fields */}
      {!isPhoto && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Category */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--rule)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...labelSt, marginBottom: 2 }}>Categoría</p>
              {editField === "category" ? (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <select value={cat_} onChange={e => setCat(e.target.value)} style={{ ...inputSt, flex: 1 }}>
                    {catsWithCurrent.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => save("category")} disabled={loading}
                    style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "5px 10px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                    <LuCheck size={11} />
                  </button>
                  <button onClick={() => { setEditField(null); setCat(tx.category); }}
                    style={{ background: "transparent", border: "1px solid var(--rule2)", color: "var(--ink3)", padding: "5px 8px", cursor: "pointer" }}>
                    <LuX size={11} />
                  </button>
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", margin: 0 }}>{cat_}</p>
              )}
            </div>
            {editField !== "category" && (
              <button onClick={() => setEditField("category")}
                style={{ ...labelSt, background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.08em", padding: "2px 0", marginLeft: 12, flexShrink: 0 }}>
                cambiar
              </button>
            )}
          </div>

          {/* Amount */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--rule)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...labelSt, marginBottom: 2 }}>Importe ({tx.currency})</p>
              {editField === "amount" ? (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input type="number" value={amt_} onChange={e => setAmt(e.target.value)} min="0" step="any" style={{ ...inputSt, width: 100 }} autoFocus />
                  <button onClick={() => save("amount")} disabled={loading}
                    style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "5px 10px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                    <LuCheck size={11} />
                  </button>
                  <button onClick={() => { setEditField(null); setAmt(String(tx.amount)); }}
                    style={{ background: "transparent", border: "1px solid var(--rule2)", color: "var(--ink3)", padding: "5px 8px", cursor: "pointer" }}>
                    <LuX size={11} />
                  </button>
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink)", fontVariantNumeric: "tabular-nums", margin: 0 }}>{amt_}</p>
              )}
            </div>
            {editField !== "amount" && (
              <button onClick={() => setEditField("amount")}
                style={{ ...labelSt, background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.08em", padding: "2px 0", marginLeft: 12, flexShrink: 0 }}>
                cambiar
              </button>
            )}
          </div>

          {/* Date */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--rule)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...labelSt, marginBottom: 2 }}>Fecha</p>
              {editField === "date" ? (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input type="date" value={date_} onChange={e => setDate(e.target.value)} style={{ ...inputSt, flex: 1 }} autoFocus />
                  <button onClick={() => save("date")} disabled={loading}
                    style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "5px 10px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                    <LuCheck size={11} />
                  </button>
                  <button onClick={() => { setEditField(null); setDate(tx.date.slice(0, 10)); }}
                    style={{ background: "transparent", border: "1px solid var(--rule2)", color: "var(--ink3)", padding: "5px 8px", cursor: "pointer" }}>
                    <LuX size={11} />
                  </button>
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", margin: 0 }}>{fmtDate(tx.date)}</p>
              )}
            </div>
            {editField !== "date" && (
              <button onClick={() => setEditField("date")}
                style={{ ...labelSt, background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.08em", padding: "2px 0", marginLeft: 12, flexShrink: 0 }}>
                cambiar
              </button>
            )}
          </div>

          {/* Notes — placeholder */}
          <div style={{ padding: "9px 0", borderBottom: "1px solid var(--rule)" }}>
            <p style={{ ...labelSt, marginBottom: 2 }}>Notas</p>
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink3)", margin: 0 }}>
              Agregar nota…
            </p>
          </div>
        </div>
      )}

      {/* Category stats */}
      {catTotal > 0 && (
        <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--paper2)" }}>
          <p style={{ ...labelSt, marginBottom: 4 }}>En el mes · {tx.category}</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink)", fontVariantNumeric: "tabular-nums", margin: 0 }}>
            {fmtBig(catTotal, tx.currency)}
            {catPct > 0 && (
              <span style={{ color: "var(--ink3)", fontSize: 12, fontWeight: 400 }}>
                {" "}· {catPct}% de tus {isExpense ? "gastos" : "ingresos"}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Actions */}
      {!isPhoto && (
        <div style={{ marginTop: 20 }}>
          {!delConfirm ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleDuplicate}
                style={{
                  flex: 1, background: "transparent", border: "1px solid var(--rule2)", color: "var(--ink2)",
                  padding: "10px 0", fontFamily: "var(--font-mono)", fontSize: 10,
                  letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
                }}>
                <LuCopy size={11} /> Duplicar
              </button>
              <button onClick={() => setDelConfirm(true)}
                style={{
                  flex: 1, background: "transparent", border: "1px solid var(--brick)", color: "var(--brick)",
                  padding: "10px 0", fontFamily: "var(--font-mono)", fontSize: 10,
                  letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
                }}>
                <LuTrash2 size={11} /> Eliminar
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleDelete}
                style={{ flex: 1, background: "var(--brick)", color: "var(--paper)", border: "none", padding: "10px 0", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                Confirmar
              </button>
              <button onClick={() => setDelConfirm(false)}
                style={{ flex: 1, background: "transparent", border: "1px solid var(--rule2)", color: "var(--ink3)", padding: "10px 0", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
