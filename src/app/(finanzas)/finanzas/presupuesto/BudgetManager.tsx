"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuTrash2, LuPlus, LuPencil, LuCheck, LuX, LuRepeat } from "react-icons/lu";
import { useCurrency } from "@/context/CurrencyContext";

interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  currency: string;
}

interface GastoItem {
  category: string;
  amount: number;
  currency: "ARS" | "USD";
}

interface Suscripcion {
  id: string;
  description: string;
  amount: number;
  currency: "ARS" | "USD";
  category: string;
  dayOfMonth: number;
}

interface Props {
  budgets: Budget[];
  allGastos: GastoItem[];
  usdArs: number;
  categorias: string[];
  suscripciones: Suscripcion[];
}

function convertTo(amount: number, from: "ARS" | "USD", to: "ARS" | "USD", usdArs: number): number {
  if (from === to) return amount;
  if (from === "ARS" && to === "USD") return amount / usdArs;
  return amount * usdArs;
}

function BudgetBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over = spent > limit;
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-700">
      <div
        className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-green-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function BudgetManager({ budgets, allGastos, usdArs, categorias, suscripciones }: Props) {
  const router = useRouter();
  const { fmt } = useCurrency();
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [newCurrency, setNewCurrency] = useState<"ARS" | "USD">("ARS");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const existingCategories = new Set(budgets.map((b) => b.category));
  const available = categorias.filter((c) => !existingCategories.has(c));

  // Suma gastos de una categoría convertidos a la moneda del presupuesto
  function spentForBudget(b: Budget): number {
    const budgetCur = b.currency as "ARS" | "USD";
    return allGastos
      .filter((g) => g.category === b.category)
      .reduce((sum, g) => sum + convertTo(g.amount, g.currency, budgetCur, usdArs), 0);
  }

  async function handleAdd() {
    if (!newCat || !newLimit) return;
    setSaving(true);
    await fetch("/api/finanzas/presupuesto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newCat, monthlyLimit: newLimit, currency: newCurrency }),
    });
    setSaving(false);
    setAdding(false);
    setNewCat(""); setNewLimit(""); setNewCurrency("ARS");
    router.refresh();
  }

  async function handleEdit(id: string, origCurrency: string) {
    if (!editLimit) return;
    setSaving(true);
    const b = budgets.find((b) => b.id === id)!;
    await fetch("/api/finanzas/presupuesto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: b.category, monthlyLimit: editLimit, currency: origCurrency }),
    });
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string, category: string) {
    if (!confirm(`¿Eliminar presupuesto para "${category}"?`)) return;
    await fetch("/api/finanzas/presupuesto", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  const INPUT = "rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500";

  const totalSuscARS = suscripciones.filter((s) => s.currency === "ARS").reduce((sum, s) => sum + s.amount, 0);
  const totalSuscUSD = suscripciones.filter((s) => s.currency === "USD").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-4">
      {/* Presupuestos */}
      <div className="space-y-3">
        {budgets.map((b) => {
          const budgetCur = b.currency as "ARS" | "USD";
          const spent = spentForBudget(b);
          const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
          const over = spent > b.monthlyLimit;
          const isEditing = editingId === b.id;

          return (
            <div key={b.id} className="rounded-xl bg-neutral-800 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{b.category}</p>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${budgetCur === "USD" ? "bg-blue-900/40 text-blue-400" : "bg-neutral-700 text-neutral-400"}`}>
                        {budgetCur}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <input type="number" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} className={`${INPUT} w-28`} autoFocus />
                          <button onClick={() => handleEdit(b.id, b.currency)} disabled={saving} className="rounded-lg p-1.5 text-green-400 hover:bg-neutral-700"><LuCheck size={14} /></button>
                          <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700"><LuX size={14} /></button>
                        </>
                      ) : (
                        <>
                          <span className={`text-sm font-medium tabular-nums ${over ? "text-red-400" : "text-neutral-300"}`}>
                            {fmt(spent, budgetCur)} / {fmt(b.monthlyLimit, budgetCur)}
                          </span>
                          <button onClick={() => { setEditingId(b.id); setEditLimit(String(b.monthlyLimit)); }} className="ml-1 rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-white"><LuPencil size={13} /></button>
                          <button onClick={() => handleDelete(b.id, b.category)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-red-400"><LuTrash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  <BudgetBar spent={spent} limit={b.monthlyLimit} />
                  <div className="mt-1 flex justify-between text-xs text-neutral-500">
                    <span>{pct.toFixed(0)}% usado</span>
                    {over
                      ? <span className="text-red-400">Excedido en {fmt(spent - b.monthlyLimit, budgetCur)}</span>
                      : <span className="text-neutral-600">Disponible {fmt(b.monthlyLimit - spent, budgetCur)}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="rounded-xl bg-neutral-800 px-5 py-4 space-y-3">
          <p className="text-sm font-medium text-white">Nuevo presupuesto</p>
          <div className="flex flex-wrap gap-2">
            <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className={`${INPUT} flex-1 min-w-[160px]`}>
              <option value="">Seleccioná categoría</option>
              {available.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} placeholder="Límite" className={`${INPUT} w-32`} />
            <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value as "ARS" | "USD")} className={`${INPUT} w-24`}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !newCat || !newLimit} className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Guardando..." : "Agregar"}
            </button>
            <button onClick={() => { setAdding(false); setNewCat(""); setNewLimit(""); }} className="rounded-lg bg-neutral-700 px-4 py-1.5 text-xs text-white hover:bg-neutral-600">Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-4 text-sm text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors">
          <LuPlus size={16} /> Agregar presupuesto
        </button>
      )}

      {/* Sección Suscripciones recurrentes */}
      {suscripciones.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LuRepeat size={13} className="text-neutral-500" />
              <p className="text-sm font-semibold text-neutral-300">Suscripciones recurrentes</p>
            </div>
            <div className="flex gap-3 text-xs text-neutral-500">
              {totalSuscARS > 0 && (
                <span>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(totalSuscARS)}/mes</span>
              )}
              {totalSuscUSD > 0 && (
                <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalSuscUSD)}/mes</span>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-neutral-800 divide-y divide-neutral-700">
            {suscripciones.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-white">{s.description}</p>
                  <p className="text-xs text-neutral-500">{s.category} · día {s.dayOfMonth}</p>
                </div>
                <p className="text-sm font-semibold text-neutral-300 tabular-nums">
                  {s.currency === "USD"
                    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(s.amount)
                    : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(s.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
