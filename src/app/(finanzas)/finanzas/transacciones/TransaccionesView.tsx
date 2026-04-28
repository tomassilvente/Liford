"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
// Cada monto se muestra en su moneda original — sin conversión

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
const fmtNative = (n: number, currency: string) => currency === "USD" ? fmtUSD(n) : fmtARS(n);
import { LuSearch, LuX, LuTrendingDown, LuTrendingUp, LuRepeat, LuCheck, LuPencil, LuTrash2, LuEllipsis } from "react-icons/lu";
import { toast } from "sonner";
import RecurrentRuleModal from "@/components/finanzas/RecurrentRuleModal";

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
  wallets: { id: string; name: string; currency: string }[];
  foreignAccounts: { id: string; name: string; currency: string }[];
  initialTipo?: "" | "EXPENSE" | "INCOME";
  initialRange?: RangeKey;
  userCategories?: UserCategory[];
}

type RangeKey = "week" | "month" | "3m" | "year" | "ytd" | "all";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "week",  label: "7 días" },
  { key: "month", label: "Este mes" },
  { key: "3m",    label: "3 meses" },
  { key: "year",  label: "12 meses" },
  { key: "ytd",   label: "Este año" },
  { key: "all",   label: "Todo" },
];

function getRange(key: RangeKey): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  switch (key) {
    case "week":  return { from: new Date(now.getTime() - 6 * 86400000), to };
    case "month": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
    case "3m":    return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to };
    case "year":  return { from: new Date(now.getFullYear(), now.getMonth() - 11, 1), to };
    case "ytd":   return { from: new Date(now.getFullYear(), 0, 1), to };
    case "all":   return { from: new Date(0), to };
  }
}

const FALLBACK_GASTO  = ["Alimentación","Transporte","Entretenimiento","Salud","Servicios","Ropa","Educación","Suscripciones","Otro"];
const FALLBACK_INGRESO = ["Sueldo","Freelance","Fotografía","Venta","Inversión","Transferencia recibida","Reembolso","Otro"];

const INPUT = "rounded-lg bg-neutral-800 px-3 py-1.5 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500";

function EditRow({
  id, description, category, amount, type, onDone, userCategories,
}: {
  id: string; description: string | null; category: string; amount: number; type: TxType; onDone: () => void;
  userCategories: UserCategory[];
}) {
  const router = useRouter();
  const [desc, setDesc] = useState(description ?? "");
  const [cat, setCat] = useState(category);
  const [amt, setAmt] = useState(String(amount));
  const [loading, setLoading] = useState(false);

  const userCatsForType = userCategories.filter((c) =>
    type === "EXPENSE" ? c.type === "EXPENSE" || c.type === "BOTH" : c.type === "INCOME" || c.type === "BOTH"
  ).map((c) => c.name);
  const fallback = type === "EXPENSE" ? FALLBACK_GASTO : FALLBACK_INGRESO;
  const cats = userCatsForType.length > 0 ? userCatsForType : fallback;
  // Siempre incluir la categoría actual aunque no esté en la lista
  const catsWithCurrent = cats.includes(category) ? cats : [category, ...cats];

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/finanzas/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc, category: cat, amount: amt }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Guardado"); onDone(); router.refresh(); }
    else toast.error("No se pudo guardar");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      <input value={desc} onChange={(e) => setDesc(e.target.value)} className={`${INPUT} min-w-0 flex-1`} placeholder="Descripción" />
      <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} className={`${INPUT} w-24`} />
      <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${INPUT} flex-1`}>
        {catsWithCurrent.map((c) => <option key={c}>{c}</option>)}
      </select>
      <button onClick={save} disabled={loading} className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-500 disabled:opacity-50">
        <LuCheck size={14} />
      </button>
      <button onClick={onDone} className="rounded-lg bg-neutral-700 p-1.5 text-white hover:bg-neutral-600">
        <LuX size={14} />
      </button>
    </div>
  );
}

function TxRow({ tx, onEdit, onOpenRule }: { tx: Transaction; onEdit: () => void; onOpenRule: (id: string) => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isExpense = tx.type === "EXPENSE" || tx.type === "STOCK_PURCHASE" || tx.type === "CRYPTO_PURCHASE";
  const isPhoto = tx.source === "PHOTOGRAPHY";

  async function handleDelete() {
    const res = await fetch(`/api/finanzas/transactions/${tx.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminada"); router.refresh(); }
    else toast.error("No se pudo eliminar");
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={`flex-shrink-0 ${isExpense ? "text-red-400" : "text-green-400"}`}>
          {isExpense ? <LuTrendingDown size={15} /> : <LuTrendingUp size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm text-white">{tx.description ?? tx.category}</p>
            {isPhoto && (
              <span className="flex-shrink-0 rounded-full bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">Foto</span>
            )}
            {tx.isRecurring && tx.recurrentRuleId && (
              <button
                onClick={() => onOpenRule(tx.recurrentRuleId!)}
                className="flex-shrink-0 text-neutral-500 hover:text-blue-400 transition-colors"
                title="Ver regla recurrente"
              >
                <LuRepeat size={11} />
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500">{tx.category}</p>
        </div>
        <p className={`flex-shrink-0 text-sm font-semibold tabular-nums ${isExpense ? "text-red-400" : "text-green-400"}`}>
          {isExpense ? "-" : "+"}{fmtNative(tx.amount, tx.currency)}
        </p>
        {isPhoto ? (
          <div className="w-[26px] flex-shrink-0" />
        ) : (
          <div className="relative flex-shrink-0">
            <button onClick={() => setMenuOpen((v) => !v)} className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-700 hover:text-neutral-300">
              <LuEllipsis size={15} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirming(false); }} />
                <div className="absolute right-0 bottom-full z-20 mb-1 flex flex-col overflow-hidden rounded-lg bg-neutral-700 shadow-lg min-w-[140px]">
                  {!confirming ? (
                    <>
                      <button onClick={() => { setMenuOpen(false); onEdit(); }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-200 hover:bg-neutral-600">
                        <LuPencil size={13} /> Editar
                      </button>
                      <button onClick={() => setConfirming(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-neutral-600">
                        <LuTrash2 size={13} /> Eliminar
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-1 p-2 w-44">
                      <p className="px-2 py-1 text-xs text-neutral-400">¿Eliminar?</p>
                      <button onClick={() => { setMenuOpen(false); setConfirming(false); handleDelete(); }} className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500">Sí, eliminar</button>
                      <button onClick={() => setConfirming(false)} className="rounded-md bg-neutral-600 px-3 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-500">Cancelar</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
    </div>
  );
}

export default function TransaccionesView({ transactions, initialTipo = "", initialRange = "month", userCategories = [] }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "EXPENSE" | "INCOME">(initialTipo);
  const [catFilter, setCatFilter] = useState("");
  const [range, setRange] = useState<RangeKey>(initialRange);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ruleModalId, setRuleModalId] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync filter state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (typeFilter) params.set("tipo", typeFilter === "EXPENSE" ? "expense" : "income");
    else params.delete("tipo");
    if (range !== "month") params.set("rango", range);
    else params.delete("rango");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, range]);

  const { from, to } = useMemo(() => getRange(range), [range]);
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      if (d < from || d >= to) return false;
      if (typeFilter && t.type !== typeFilter) return false;
      if (catFilter && t.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.description?.toLowerCase().includes(q) &&
          !t.category.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [transactions, from, to, typeFilter, catFilter, search]);

  // KPIs por moneda — sin conversión
  const kpis = useMemo(() => {
    const ingresosARS = filtered.filter((t) => t.type === "INCOME"   && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
    const ingresosUSD = filtered.filter((t) => t.type === "INCOME"   && t.currency === "USD").reduce((s, t) => s + t.amount, 0);
    const gastosARS   = filtered.filter((t) => t.type === "EXPENSE"  && t.currency === "ARS").reduce((s, t) => s + t.amount, 0);
    const gastosUSD   = filtered.filter((t) => t.type === "EXPENSE"  && t.currency === "USD").reduce((s, t) => s + t.amount, 0);
    return { ingresosARS, ingresosUSD, gastosARS, gastosUSD, balanceARS: ingresosARS - gastosARS, balanceUSD: ingresosUSD - gastosUSD };
  }, [filtered]);

  // Agrupar por día con headers "HOY · 25 ABR" / "AYER · 24 ABR"
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; txs: Transaction[] }>();
    const todayStr = new Date().toDateString();
    const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    for (const t of filtered) {
      const d = new Date(t.date);
      const dStr = d.toDateString();
      const dayKey = d.toISOString().slice(0, 10);
      let label: string;
      if (dStr === todayStr) {
        label = `HOY · ${d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }).toUpperCase()}`;
      } else if (dStr === yesterdayStr) {
        label = `AYER · ${d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }).toUpperCase()}`;
      } else {
        label = d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();
      }
      if (!map.has(dayKey)) map.set(dayKey, { label, txs: [] });
      map.get(dayKey)!.txs.push(t);
    }
    return Array.from(map.values());
  }, [filtered]);

  const allCategories = Array.from(new Set(transactions.map((t) => t.category))).sort();
  const hasFilters = typeFilter || catFilter || search;

  return (
    <div>
      {/* KPI strip — por moneda, sin conversión */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-neutral-800 p-3">
          <p className="text-xs text-neutral-500 mb-1">Ingresos</p>
          {kpis.ingresosARS > 0 && <p className="text-sm font-bold text-green-400 tabular-nums">{fmtARS(kpis.ingresosARS)}</p>}
          {kpis.ingresosUSD > 0 && <p className="text-sm font-bold text-green-400 tabular-nums">{fmtUSD(kpis.ingresosUSD)}</p>}
          {kpis.ingresosARS === 0 && kpis.ingresosUSD === 0 && <p className="text-sm font-bold text-neutral-600">—</p>}
        </div>
        <div className="rounded-xl bg-neutral-800 p-3">
          <p className="text-xs text-neutral-500 mb-1">Gastos</p>
          {kpis.gastosARS > 0 && <p className="text-sm font-bold text-red-400 tabular-nums">{fmtARS(kpis.gastosARS)}</p>}
          {kpis.gastosUSD > 0 && <p className="text-sm font-bold text-red-400 tabular-nums">{fmtUSD(kpis.gastosUSD)}</p>}
          {kpis.gastosARS === 0 && kpis.gastosUSD === 0 && <p className="text-sm font-bold text-neutral-600">—</p>}
        </div>
        <div className="rounded-xl bg-neutral-800 p-3">
          <p className="text-xs text-neutral-500 mb-1">Balance</p>
          {(kpis.ingresosARS > 0 || kpis.gastosARS > 0) && (
            <p className={`text-sm font-bold tabular-nums ${kpis.balanceARS >= 0 ? "text-white" : "text-red-400"}`}>{fmtARS(kpis.balanceARS)}</p>
          )}
          {(kpis.ingresosUSD > 0 || kpis.gastosUSD > 0) && (
            <p className={`text-sm font-bold tabular-nums ${kpis.balanceUSD >= 0 ? "text-white" : "text-red-400"}`}>{fmtUSD(kpis.balanceUSD)}</p>
          )}
          {kpis.ingresosARS === 0 && kpis.gastosARS === 0 && kpis.ingresosUSD === 0 && kpis.gastosUSD === 0 && (
            <p className="text-sm font-bold text-neutral-600">—</p>
          )}
        </div>
      </div>

      {/* Rango de fechas */}
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              range === r.key ? "bg-neutral-700 text-white" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative mb-3">
        <LuSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por descripción, monto o categoría…"
          className="w-full rounded-lg bg-neutral-800 py-2 pl-8 pr-3 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
            <LuX size={13} />
          </button>
        )}
      </div>

      {/* Chips de filtro */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {/* Tipo */}
        {(["EXPENSE", "INCOME"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setTypeFilter(typeFilter === v ? "" : v)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              typeFilter === v
                ? "bg-neutral-700 text-white ring-1 ring-neutral-600"
                : "bg-neutral-800/60 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
            }`}
          >
            {v === "EXPENSE" ? "Gastos" : "Ingresos"}
            {typeFilter === v && <LuX size={10} />}
          </button>
        ))}

        {/* Categoría — select si no hay activa, chip si hay */}
        {catFilter ? (
          <button
            onClick={() => setCatFilter("")}
            className="flex items-center gap-1 rounded-full bg-neutral-700 px-3 py-1 text-xs font-medium text-white ring-1 ring-neutral-600"
          >
            {catFilter} <LuX size={10} />
          </button>
        ) : (
          <select
            value=""
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-full bg-neutral-800/60 px-3 py-1 text-xs text-neutral-500 outline-none hover:bg-neutral-800 hover:text-neutral-300 cursor-pointer"
          >
            <option value="">+ Categoría</option>
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setTypeFilter(""); setCatFilter(""); }}
            className="rounded-full px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Conteo */}
      <p className="mb-4 text-xs text-neutral-600">
        {filtered.length} transacciones{hasFilters ? " (filtradas)" : ""}
      </p>

      {/* Lista agrupada por día */}
      {grouped.length === 0 ? (
        <p className="text-sm text-neutral-500">No hay transacciones en este período.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ label, txs }) => (
            <div key={label}>
              <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-neutral-500">{label}</p>
              <div className="rounded-xl bg-neutral-800 divide-y divide-neutral-700">
                {txs.map((t) =>
                  editingId === t.id ? (
                    <EditRow
                      key={t.id}
                      id={t.id}
                      description={t.description}
                      category={t.category}
                      amount={t.amount}
                      type={t.type}
                      onDone={() => setEditingId(null)}
                      userCategories={userCategories}
                    />
                  ) : (
                    <TxRow key={t.id} tx={t} onEdit={() => setEditingId(t.id)} onOpenRule={setRuleModalId} />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal regla recurrente — fuera del listado para no afectar el layout */}
      {ruleModalId && (
        <RecurrentRuleModal ruleId={ruleModalId} onClose={() => setRuleModalId(null)} />
      )}
    </div>
  );
}
