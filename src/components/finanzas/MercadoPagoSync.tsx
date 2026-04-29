"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuLoader, LuCheck, LuRefreshCw, LuCircleAlert, LuCopy, LuArrowLeftRight, LuPencil, LuX } from "react-icons/lu";
import { toast } from "sonner";

interface MPTransaction {
  date: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  currency: "ARS" | "USD";
  category: string;
  description: string;
  source: "PERSONAL";
  mpId: string;
  possibleDuplicate: boolean;
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount) + " " + currency;
}

const CATEGORIAS: Record<"EXPENSE" | "INCOME", string[]> = {
  EXPENSE: ["Alimentación", "Transporte", "Entretenimiento", "Salud", "Servicios", "Ropa", "Educación", "Suscripciones", "Otro"],
  INCOME: ["Sueldo", "Freelance", "Fotografía", "Venta", "Inversión", "Transferencia recibida", "Reembolso", "Otro"],
};

const inputSt: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "var(--paper)", border: "1px solid var(--rule2)",
  padding: "7px 10px", fontFamily: "var(--font-serif)", fontSize: 13,
  color: "var(--ink)", outline: "none",
};

interface Wallet { id: string; name: string; currency: string; }

export default function MercadoPagoSync({ wallets }: { wallets: Wallet[] }) {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<MPTransaction[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [done, setDone] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  async function sync() {
    setLoading(true); setError(null); setTransactions(null); setDone(null); setEditing(null);
    try {
      const res = await fetch(`/api/finanzas/mercadopago?days=${days}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al sincronizar");
      setTransactions(data.transactions);
      setSelected(new Set(data.transactions.map((_: unknown, i: number) => i).filter((i: number) => !data.transactions[i].possibleDuplicate)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function flipType(i: number) {
    if (!transactions) return;
    const updated = [...transactions];
    updated[i] = { ...updated[i], type: updated[i].type === "EXPENSE" ? "INCOME" : "EXPENSE", category: "Otro" };
    setTransactions(updated);
  }

  function updateField(i: number, field: keyof MPTransaction, value: string) {
    if (!transactions) return;
    const updated = [...transactions];
    updated[i] = { ...updated[i], [field]: value };
    setTransactions(updated);
  }

  async function confirm() {
    if (!transactions) return;
    const toImport = transactions.filter((_, i) => selected.has(i)).map(({ mpId: _, possibleDuplicate: __, ...t }) => t);
    setSaving(true);
    try {
      const res = await fetch("/api/finanzas/mercadopago/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: toImport, walletId: walletId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al importar");
      setDone(data.imported); setTransactions(null);
      const walletMsg = data.walletName ? ` · ${data.walletName} actualizado` : "";
      toast.success(`${data.imported} movimientos importados${walletMsg}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setSaving(false);
    }
  }

  if (done !== null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 24px", border: "1px solid var(--olive)", background: "var(--paper2)", textAlign: "center" }}>
        <LuCheck size={24} style={{ color: "var(--olive)" }} />
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--ink)", margin: 0 }}>{done} movimientos importados</p>
        <button onClick={() => setDone(null)} style={{ background: "transparent", border: "none", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>
          Sincronizar de nuevo
        </button>
      </div>
    );
  }

  if (transactions) {
    const dupeCount = transactions.filter((t) => t.possibleDuplicate).length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Instructions */}
        <div style={{ padding: "14px 16px", background: "var(--paper2)", border: "1px solid var(--rule2)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Cómo usar</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { n: "1", text: "Revisá la dirección. Tocá GASTO/INGRESO para invertirlo si MP lo clasificó mal." },
              { n: "2", text: "Editá descripción y categoría con el lápiz en cada fila." },
              { n: "3", text: "Destildá los duplicados que ya tenés y presioná Importar." },
            ].map((s) => (
              <div key={s.n} style={{ display: "flex", gap: 10 }}>
                <span style={{ flexShrink: 0, width: 18, height: 18, border: "1px solid var(--ink)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink)" }}>{s.n}</span>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink2)", margin: 0, lineHeight: 1.5 }}>{s.text}</p>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--rust)", margin: "10px 0 0", borderTop: "1px dashed var(--rule)", paddingTop: 8 }}>
            Esta sincronización no actualiza el saldo de tus billeteras. Ajustalo manualmente en Billeteras si es necesario.
          </p>
        </div>

        {dupeCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderLeft: "3px solid var(--rust)", background: "var(--paper2)", fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--rust)" }}>
            <LuCopy size={14} style={{ flexShrink: 0 }} />
            {dupeCount} {dupeCount === 1 ? "movimiento coincide" : "movimientos coinciden"} con transacciones ya registradas — deseleccionados.
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => { if (!transactions) return; selected.size === transactions.length ? setSelected(new Set()) : setSelected(new Set(transactions.map((_, i) => i))); }}
              style={{ background: "transparent", border: "none", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {selected.size === transactions.length ? "Deseleccionar todo" : "Seleccionar todo"}
            </button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)" }}>{selected.size} / {transactions.length}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setTransactions(null)}
              style={{ background: "transparent", border: "1px solid var(--rule2)", padding: "7px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--ink3)", cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={confirm} disabled={saving || selected.size === 0}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--ink)", color: "var(--paper)", border: "none", padding: "7px 16px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", opacity: (saving || selected.size === 0) ? 0.5 : 1 }}>
              {saving ? <LuLoader size={12} className="animate-spin" /> : <LuCheck size={12} />}
              {saving ? "Importando..." : `Importar ${selected.size}`}
            </button>
          </div>
        </div>

        {/* Transaction list */}
        <div style={{ border: "1px solid var(--rule2)" }}>
          {transactions.map((t, i) => (
            <div key={t.mpId} style={{ opacity: t.possibleDuplicate ? 0.45 : 1, borderBottom: i < transactions.length - 1 ? "1px dashed var(--rule)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                <input type="checkbox" checked={selected.has(i)} onChange={() => { const n = new Set(selected); n.has(i) ? n.delete(i) : n.add(i); setSelected(n); }}
                  style={{ flexShrink: 0, accentColor: "var(--ink)", cursor: "pointer" }} />

                <button onClick={() => flipType(i)} style={{
                  flexShrink: 0, background: t.type === "EXPENSE" ? "color-mix(in srgb, var(--brick) 10%, var(--paper2))" : "color-mix(in srgb, var(--olive) 10%, var(--paper2))",
                  color: t.type === "EXPENSE" ? "var(--brick)" : "var(--olive)",
                  border: `1px solid ${t.type === "EXPENSE" ? "var(--brick)" : "var(--olive)"}`,
                  padding: "2px 8px", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {t.type === "EXPENSE" ? "GASTO" : "INGRESO"} <LuArrowLeftRight size={9} />
                </button>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</p>
                    {t.possibleDuplicate && (
                      <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--rust)", border: "1px solid var(--rust)", padding: "1px 5px", letterSpacing: "0.06em" }}>DUP.</span>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", margin: "2px 0 0" }}>{t.category} · {t.date}</p>
                </div>

                <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 13, color: t.type === "EXPENSE" ? "var(--brick)" : "var(--olive)", fontVariantNumeric: "tabular-nums" }}>
                  {t.type === "EXPENSE" ? "−" : "+"} {fmt(t.amount, t.currency)}
                </span>

                <button onClick={() => setEditing(editing === i ? null : i)}
                  style={{ flexShrink: 0, background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer", lineHeight: 1 }} title="Editar">
                  {editing === i ? <LuX size={13} /> : <LuPencil size={13} />}
                </button>
              </div>

              {editing === i && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 12px 12px", borderTop: "1px solid var(--rule2)", background: "var(--paper2)" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Descripción</p>
                    <input value={t.description} onChange={(e) => updateField(i, "description", e.target.value)} style={inputSt} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Categoría</p>
                    <select value={t.category} onChange={(e) => updateField(i, "category", e.target.value)} style={inputSt}>
                      {CATEGORIAS[t.type].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button onClick={() => setEditing(null)}
                      style={{ width: "100%", background: "var(--ink)", color: "var(--paper)", border: "none", padding: "8px 0", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                      Listo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Description */}
      <div style={{ padding: "14px 16px", background: "var(--paper2)", border: "1px solid var(--rule2)" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 8px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Qué hace esta función</p>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink2)", margin: "0 0 8px", lineHeight: 1.5 }}>
          Trae tus movimientos de Mercado Pago directamente y te muestra una preview para revisar antes de importarlos.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            "Detecta automáticamente si cada movimiento es gasto o ingreso.",
            "Compara contra lo ya registrado y marca los posibles duplicados.",
            "Podés editar descripción, categoría y dirección antes de confirmar.",
          ].map((t, i) => (
            <p key={i} style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink3)", margin: 0 }}>→ {t}</p>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--rust)", margin: "8px 0 0", borderTop: "1px dashed var(--rule)", paddingTop: 8 }}>
          No actualiza el saldo de tus billeteras automáticamente.
        </p>
      </div>

      {/* Sync form */}
      <div style={{ padding: "16px", background: "var(--paper2)", border: "1px solid var(--rule2)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 14 }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 6px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Período</p>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={inputSt}>
              <option value={7}>Últimos 7 días</option>
              <option value={15}>Últimos 15 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={60}>Últimos 60 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", margin: "0 0 6px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Actualizar saldo de</p>
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)} style={inputSt}>
              <option value="">Sin actualizar saldo</option>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
            </select>
          </div>
        </div>
        <button onClick={sync} disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--ink)", color: "var(--paper)", border: "none", padding: "10px 24px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
          {loading ? <LuLoader size={14} className="animate-spin" /> : <LuRefreshCw size={14} />}
          {loading ? "Conectando..." : "Sincronizar"}
        </button>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderLeft: "3px solid var(--brick)", background: "var(--paper2)" }}>
          <LuCircleAlert size={15} style={{ flexShrink: 0, color: "var(--brick)", marginTop: 2 }} />
          <div>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--brick)", margin: 0 }}>No se pudo conectar con Mercado Pago</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink3)", margin: "4px 0 0" }}>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
