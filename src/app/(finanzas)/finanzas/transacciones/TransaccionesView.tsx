"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LuSearch, LuX, LuCheck, LuPencil, LuTrash2, LuEllipsis } from "react-icons/lu";
import { toast } from "sonner";
import RecurrentRuleModal from "@/components/finanzas/RecurrentRuleModal";
import MonthFilter from "@/components/finanzas/MonthFilter";

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(n);
const fmtNative = (n: number, currency: string) => currency === "USD" ? fmtUSD(n) : fmtARS(n);

type TxType = "EXPENSE" | "INCOME" | "STOCK_PURCHASE" | "CRYPTO_PURCHASE";

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  source: string;
  date: string;
  isRecurring?: boolean;
  recurrentRuleId?: string | null;
}

interface UserCategory { name: string; icon: string; type: string; }

interface Props {
  transactions: Transaction[];
  mesYM: string;
  prevHasData?: boolean;
  nextHasData?: boolean;
  wallets: { id: string; name: string; currency: string }[];
  foreignAccounts: { id: string; name: string; currency: string }[];
  initialTipo?: "" | "EXPENSE" | "INCOME";
  userCategories?: UserCategory[];
}

const FALLBACK_GASTO   = ["Alimentación","Transporte","Entretenimiento","Salud","Servicios","Ropa","Educación","Suscripciones","Otro"];
const FALLBACK_INGRESO = ["Sueldo","Freelance","Fotografía","Venta","Inversión","Transferencia recibida","Reembolso","Otro"];

const inputStyle: React.CSSProperties = {
  background: "var(--paper2)",
  border: "1px solid var(--rule2)",
  borderRadius: 0,
  padding: "6px 10px",
  fontFamily: "var(--font-serif)",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
};

function adjacentYM(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function EditRow({
  id, description, category, amount, type, date, onDone, userCategories,
}: {
  id: string; description: string | null; category: string; amount: number; type: TxType; date: string; onDone: () => void;
  userCategories: UserCategory[];
}) {
  const router = useRouter();
  const [desc, setDesc]     = useState(description ?? "");
  const [cat, setCat]       = useState(category);
  const [amt, setAmt]       = useState(String(amount));
  const [dateStr, setDateStr] = useState(date.slice(0, 10));
  const [loading, setLoading] = useState(false);

  const userCatsForType = userCategories.filter((c) =>
    type === "EXPENSE" ? c.type === "EXPENSE" || c.type === "BOTH" : c.type === "INCOME" || c.type === "BOTH"
  ).map((c) => c.name);
  const fallback = type === "EXPENSE" ? FALLBACK_GASTO : FALLBACK_INGRESO;
  const cats = userCatsForType.length > 0 ? userCatsForType : fallback;
  const catsWithCurrent = cats.includes(category) ? cats : [category, ...cats];

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/finanzas/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc, category: cat, amount: amt, date: dateStr }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Guardado"); onDone(); router.refresh(); }
    else toast.error("No se pudo guardar");
  }

  return (
    <td colSpan={4} style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "4px 0" }}>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 120 }} placeholder="Descripción" />
        <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} style={{ ...inputStyle, width: 90 }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
          {catsWithCurrent.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} style={{ ...inputStyle, width: 140 }} />
        <button onClick={save} disabled={loading} style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          <LuCheck size={13} />
        </button>
        <button onClick={onDone} style={{ background: "transparent", color: "var(--ink3)", border: "1px solid var(--rule2)", padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer" }}>
          <LuX size={13} />
        </button>
      </div>
    </td>
  );
}

function TxRow({ tx, onEdit, onOpenRule, userCategories }: {
  tx: Transaction;
  onEdit: () => void;
  onOpenRule: (id: string) => void;
  userCategories: UserCategory[];
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editingCat, setEditingCat] = useState(false);

  const isExpense = tx.type === "EXPENSE" || tx.type === "STOCK_PURCHASE" || tx.type === "CRYPTO_PURCHASE";
  const isPhoto   = tx.source === "PHOTOGRAPHY";

  const catsForType = userCategories
    .filter((c) => isExpense ? c.type === "EXPENSE" || c.type === "BOTH" : c.type === "INCOME" || c.type === "BOTH")
    .map((c) => c.name);
  const cats = catsForType.includes(tx.category) ? catsForType : [tx.category, ...catsForType];

  async function handleCategoryChange(newCat: string) {
    if (newCat === tx.category) { setEditingCat(false); return; }
    setEditingCat(false);
    const res = await fetch(`/api/finanzas/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newCat }),
    });
    if (res.ok) { toast.success("Categoría actualizada"); router.refresh(); }
    else toast.error("No se pudo actualizar");
  }

  async function handleDelete() {
    const res = await fetch(`/api/finanzas/transactions/${tx.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminada"); router.refresh(); }
    else toast.error("No se pudo eliminar");
  }

  return (
    <tr style={{ borderBottom: "1px dashed var(--rule)" }}>
      <td style={{ padding: "8px 12px 8px 0", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", maxWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description ?? tx.category}</span>
          {isPhoto && (
            <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--navy)", letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid var(--navy)", padding: "1px 5px" }}>FOTO</span>
          )}
          {tx.isRecurring && tx.recurrentRuleId && (
            <button
              onClick={() => onOpenRule(tx.recurrentRuleId!)}
              style={{ flexShrink: 0, background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer", fontFamily: "var(--font-serif)", fontSize: 16, fontStyle: "italic", lineHeight: 1 }}
              title="Ver regla recurrente"
            >
              ↻
            </button>
          )}
        </div>
      </td>
      <td style={{ padding: "8px 12px 8px 0", whiteSpace: "nowrap" }}>
        {editingCat ? (
          <select
            autoFocus
            defaultValue={tx.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            onBlur={() => setEditingCat(false)}
            style={{ ...inputStyle, padding: "2px 6px", fontSize: 9 }}
          >
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        ) : (
          <span
            onClick={() => !isPhoto && setEditingCat(true)}
            title={isPhoto ? undefined : "Click para cambiar categoría"}
            style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink3)", letterSpacing: "0.1em", textTransform: "uppercase", cursor: isPhoto ? "default" : "pointer" }}
          >
            {tx.category}
          </span>
        )}
      </td>
      <td style={{ padding: "8px 0", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 14, color: isExpense ? "var(--ink)" : "var(--olive)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {isExpense ? "−" : "+"} {fmtNative(tx.amount, tx.currency)} <span style={{ fontSize: 9, color: "var(--ink3)" }}>{tx.currency}</span>
      </td>
      {!isPhoto ? (
        <td style={{ padding: "8px 0 8px 12px", width: 28 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen((v) => !v)} style={{ background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer", lineHeight: 1 }}>
              <LuEllipsis size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirming(false); }} />
                <div style={{ position: "absolute", right: 0, bottom: "100%", zIndex: 20, marginBottom: 4, background: "var(--paper2)", border: "1px solid var(--rule2)", minWidth: 130 }}>
                  {!confirming ? (
                    <>
                      <button onClick={() => { setMenuOpen(false); onEdit(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "transparent", border: "none", fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}>
                        <LuPencil size={12} /> Editar
                      </button>
                      <button onClick={() => setConfirming(true)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderTop: "1px solid var(--rule)", fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--brick)", cursor: "pointer", textAlign: "left" }}>
                        <LuTrash2 size={12} /> Eliminar
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: 10 }}>
                      <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink3)", margin: "0 0 8px" }}>¿Eliminar?</p>
                      <button onClick={() => { setMenuOpen(false); setConfirming(false); handleDelete(); }} style={{ display: "block", width: "100%", background: "var(--brick)", color: "var(--paper)", border: "none", padding: "7px 0", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", marginBottom: 4 }}>Sí</button>
                      <button onClick={() => setConfirming(false)} style={{ display: "block", width: "100%", background: "transparent", border: "1px solid var(--rule2)", color: "var(--ink3)", padding: "7px 0", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", cursor: "pointer" }}>No</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </td>
      ) : (
        <td style={{ width: 28 }} />
      )}
    </tr>
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
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [ruleModalId, setRuleModalId] = useState<string | null>(null);


  const mesLabel = (() => {
    const [y, m] = mesYM.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  })();

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (catFilter && t.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.description?.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, catFilter, search]);

  const kpis = useMemo(() => {
    const ingresosARS = filtered.filter((t) => t.type === "INCOME"  && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
    const ingresosUSD = filtered.filter((t) => t.type === "INCOME"  && t.currency === "USD").reduce((s, t) => s + t.amount, 0);
    const gastosARS   = filtered.filter((t) => t.type === "EXPENSE" && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
    const gastosUSD   = filtered.filter((t) => t.type === "EXPENSE" && t.currency === "USD").reduce((s, t) => s + t.amount, 0);
    return { ingresosARS, ingresosUSD, gastosARS, gastosUSD, balanceARS: ingresosARS - gastosARS, balanceUSD: ingresosUSD - gastosUSD };
  }, [filtered]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; dateLabel: string; txs: Transaction[] }>();
    const todayKey     = new Date().toISOString().slice(0, 10);
    const yDate = new Date(); yDate.setUTCDate(yDate.getUTCDate() - 1);
    const yesterdayKey = yDate.toISOString().slice(0, 10);
    const fmtShort = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" });
    const fmtLong  = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

    for (const t of filtered) {
      const d = new Date(t.date);
      const dayKey = d.toISOString().slice(0, 10);
      let dateLabel: string;
      if (dayKey === todayKey)      dateLabel = `HOY · ${fmtShort.format(d).toUpperCase()}`;
      else if (dayKey === yesterdayKey) dateLabel = `AYER · ${fmtShort.format(d).toUpperCase()}`;
      else dateLabel = fmtLong.format(d);
      if (!map.has(dayKey)) map.set(dayKey, { label: dayKey, dateLabel, txs: [] });
      map.get(dayKey)!.txs.push(t);
    }
    return Array.from(map.values());
  }, [filtered]);

  const allCategories = Array.from(new Set(transactions.map((t) => t.category))).sort();

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{ paddingBottom: 16, borderBottom: "1px solid var(--rule2)", marginBottom: 28 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>II · Movimientos — libro de asientos</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink)", margin: 0, lineHeight: 0.95, fontStyle: "italic", letterSpacing: "-0.02em" }}>
            {mesLabel}
          </h1>
          <div style={{ marginLeft: "auto" }}>
            <MonthFilter selected={mesYM} prevHasData={prevHasData} nextHasData={nextHasData} />
          </div>
        </div>
      </header>

      {/* ── KPIs ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 32, fontFamily: "var(--font-mono)", fontSize: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <span style={{ color: "var(--ink3)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 9, marginRight: 8 }}>Entr.</span>
          {kpis.ingresosARS > 0 && <span style={{ color: "var(--olive)", fontVariantNumeric: "tabular-nums" }}>+ {fmtARS(kpis.ingresosARS)} ARS</span>}
          {kpis.ingresosUSD > 0 && <span style={{ color: "var(--olive)", fontVariantNumeric: "tabular-nums", marginLeft: 8 }}>+ {fmtUSD(kpis.ingresosUSD)} USD</span>}
          {kpis.ingresosARS === 0 && kpis.ingresosUSD === 0 && <span style={{ color: "var(--ink3)" }}>—</span>}
        </div>
        <div>
          <span style={{ color: "var(--ink3)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 9, marginRight: 8 }}>Sal.</span>
          {kpis.gastosARS > 0 && <span style={{ color: "var(--brick)", fontVariantNumeric: "tabular-nums" }}>− {fmtARS(kpis.gastosARS)} ARS</span>}
          {kpis.gastosUSD > 0 && <span style={{ color: "var(--brick)", fontVariantNumeric: "tabular-nums", marginLeft: 8 }}>− {fmtUSD(kpis.gastosUSD)} USD</span>}
          {kpis.gastosARS === 0 && kpis.gastosUSD === 0 && <span style={{ color: "var(--ink3)" }}>—</span>}
        </div>
        <div>
          <span style={{ color: "var(--ink3)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 9, marginRight: 8 }}>Bal.</span>
          {(kpis.ingresosARS > 0 || kpis.gastosARS > 0) && (
            <span style={{ color: kpis.balanceARS >= 0 ? "var(--olive)" : "var(--brick)", fontVariantNumeric: "tabular-nums" }}>
              {kpis.balanceARS >= 0 ? "+" : "−"} {fmtARS(Math.abs(kpis.balanceARS))} ARS
            </span>
          )}
          {(kpis.ingresosUSD > 0 || kpis.gastosUSD > 0) && (
            <span style={{ color: kpis.balanceUSD >= 0 ? "var(--olive)" : "var(--brick)", fontVariantNumeric: "tabular-nums", marginLeft: 8 }}>
              {kpis.balanceUSD >= 0 ? "+" : "−"} {fmtUSD(Math.abs(kpis.balanceUSD))} USD
            </span>
          )}
        </div>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--rule2)", marginBottom: 20, flexWrap: "wrap" }}>
        {/* Búsqueda */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, maxWidth: 320, padding: "3px 0", borderBottom: "1px solid var(--ink)" }}>
          <LuSearch size={13} style={{ color: "var(--ink3)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="buscar concepto…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer", lineHeight: 1 }}>
              <LuX size={12} />
            </button>
          )}
        </div>

        {/* Tipo */}
        <div style={{ display: "flex", border: "1px solid var(--rule2)" }}>
          {(["", "EXPENSE", "INCOME"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setTypeFilter(v)}
              style={{
                padding: "4px 10px",
                background: typeFilter === v ? "var(--ink)" : "transparent",
                color: typeFilter === v ? "var(--paper)" : "var(--ink3)",
                border: "none",
                borderRight: v !== "INCOME" ? "1px solid var(--rule2)" : "none",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {v === "" ? "Todo" : v === "EXPENSE" ? "Gastos" : "Ingresos"}
            </button>
          ))}
        </div>

        {/* Categoría */}
        {catFilter ? (
          <button
            onClick={() => setCatFilter("")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}
          >
            {catFilter} <LuX size={10} />
          </button>
        ) : (
          <select
            value=""
            onChange={(e) => setCatFilter(e.target.value)}
            style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--rule2)", color: "var(--ink3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", cursor: "pointer", outline: "none" }}
          >
            <option value="">Cat. · todas</option>
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", marginLeft: "auto" }}>
          fol. {filtered.length}
        </span>
      </div>

      {/* ── Ledger agrupado por día ──────────────────────────────── */}
      {grouped.length === 0 ? (
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink3)" }}>
          No hay transacciones en {mesLabel}.
        </p>
      ) : (
        <div>
          {grouped.map(({ label, dateLabel, txs }, gi) => (
            <section key={label} style={{ marginTop: gi === 0 ? 0 : 28 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8, paddingBottom: 4, borderBottom: "2px solid var(--ink)" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontStyle: "italic", color: "var(--ink)", margin: 0, lineHeight: 1 }}>{dateLabel}</h3>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", letterSpacing: "0.06em" }}>{txs.length} asiento{txs.length !== 1 ? "s" : ""}</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <colgroup>
                  <col />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 28 }} />
                </colgroup>
                <tbody>
                  {txs.map((t) =>
                    editingId === t.id ? (
                      <tr key={t.id}><EditRow id={t.id} description={t.description} category={t.category} amount={t.amount} type={t.type} date={t.date} onDone={() => setEditingId(null)} userCategories={userCategories} /></tr>
                    ) : (
                      <TxRow key={t.id} tx={t} onEdit={() => setEditingId(t.id)} onOpenRule={setRuleModalId} userCategories={userCategories} />
                    )
                  )}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}

      {ruleModalId && (
        <RecurrentRuleModal ruleId={ruleModalId} onClose={() => setRuleModalId(null)} />
      )}
    </div>
  );
}
