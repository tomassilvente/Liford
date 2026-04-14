"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuTrash2, LuPlus, LuPencil, LuCheck, LuX } from "react-icons/lu";

interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  currency: string;
}

interface Props {
  budgets: Budget[];
  gastoPorCategoria: Record<string, number>;
  categorias: string[];
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
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

export default function BudgetManager({ budgets, gastoPorCategoria, categorias }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const existingCategories = new Set(budgets.map((b) => b.category));
  const availableCategories = categorias.filter((c) => !existingCategories.has(c));

  async function handleAdd() {
    if (!newCat || !newLimit) return;
    setSaving(true);
    await fetch("/api/finanzas/presupuesto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newCat, monthlyLimit: newLimit, currency: "ARS" }),
    });
    setSaving(false);
    setAdding(false);
    setNewCat(""); setNewLimit("");
    router.refresh();
  }

  async function handleEdit(id: string) {
    if (!editLimit) return;
    setSaving(true);
    await fetch("/api/finanzas/presupuesto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: budgets.find((b) => b.id === id)!.category,
        monthlyLimit: editLimit,
        currency: "ARS",
      }),
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

  return (
    <div className="space-y-3">
      {budgets.map((b) => {
        const spent = gastoPorCategoria[b.category] ?? 0;
        const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
        const over = spent > b.monthlyLimit;
        const isEditing = editingId === b.id;

        return (
          <div key={b.id} className="rounded-xl bg-neutral-800 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{b.category}</p>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          className="w-28 rounded-lg bg-neutral-900 px-2 py-1 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
                          autoFocus
                        />
                        <button onClick={() => handleEdit(b.id)} disabled={saving} className="rounded-lg p-1.5 text-green-400 hover:bg-neutral-700">
                          <LuCheck size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700">
                          <LuX size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`text-sm font-medium ${over ? "text-red-400" : "text-neutral-300"}`}>
                          {fmt(spent)} / {fmt(b.monthlyLimit)}
                        </span>
                        <button
                          onClick={() => { setEditingId(b.id); setEditLimit(String(b.monthlyLimit)); }}
                          className="ml-2 rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-white"
                        >
                          <LuPencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.category)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-red-400"
                        >
                          <LuTrash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <BudgetBar spent={spent} limit={b.monthlyLimit} />
                <div className="mt-1 flex justify-between text-xs text-neutral-500">
                  <span>{pct.toFixed(0)}% usado</span>
                  {over
                    ? <span className="text-red-400">Excedido en {fmt(spent - b.monthlyLimit)}</span>
                    : <span className="text-neutral-600">Disponible {fmt(b.monthlyLimit - spent)}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Agregar nuevo presupuesto */}
      {adding ? (
        <div className="rounded-xl bg-neutral-800 px-5 py-4">
          <p className="mb-3 text-sm font-medium text-white">Nueva categoría</p>
          <div className="flex gap-2">
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            >
              <option value="">Seleccioná una categoría</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder="Límite mensual"
              className="w-36 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newCat || !newLimit}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Agregar"}
            </button>
            <button
              onClick={() => { setAdding(false); setNewCat(""); setNewLimit(""); }}
              className="rounded-lg bg-neutral-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : availableCategories.length > 0 && (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-4 text-sm text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
        >
          <LuPlus size={16} /> Agregar categoría
        </button>
      )}
    </div>
  );
}
