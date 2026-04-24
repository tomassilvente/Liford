"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuPencil, LuTrash2, LuCheck, LuX, LuEllipsis } from "react-icons/lu";
import { toast } from "sonner";

interface TransactionRowProps {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  currency: string;
  type: "EXPENSE" | "INCOME";
  categories: string[];
  source?: "PERSONAL" | "PHOTOGRAPHY";
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function TransactionRow({
  id,
  description,
  category,
  date,
  amount,
  currency,
  type,
  categories,
  source = "PERSONAL",
}: TransactionRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [desc, setDesc] = useState(description);
  const [cat, setCat] = useState(category);
  const [amt, setAmt] = useState(String(amount));
  const [loading, setLoading] = useState(false);

  const isExpense = type === "EXPENSE";

  async function handleSave() {
    setLoading(true);
    const res = await fetch(`/api/finanzas/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc, category: cat, amount: amt }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Transacción actualizada");
      setEditing(false);
      router.refresh();
    } else {
      toast.error("No se pudo actualizar");
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/finanzas/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transacción eliminada");
      router.refresh();
    } else {
      toast.error("No se pudo eliminar");
    }
  }

  // ── Modo edición ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="flex flex-col gap-2 px-4 py-3">
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            min="0.01"
            step="0.01"
            className="w-28 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="flex-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-500 disabled:opacity-50"
            title="Guardar"
          >
            <LuCheck size={14} />
          </button>
          <button
            onClick={() => { setEditing(false); setDesc(description); setCat(category); setAmt(String(amount)); }}
            className="rounded-lg bg-neutral-700 p-1.5 text-white hover:bg-neutral-600"
            title="Cancelar"
          >
            <LuX size={14} />
          </button>
        </div>
      </div>
    );
  }

  const isPhotography = source === "PHOTOGRAPHY";

  // ── Modo normal ───────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Texto — ocupa todo el espacio disponible */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-white">{description}</p>
          {isPhotography && (
            <span className="flex-shrink-0 rounded-full bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
              Fotografía
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500">{category} · {formatDate(date)}</p>
      </div>

      {/* Monto */}
      <p className={`flex-shrink-0 text-sm font-semibold ${isExpense ? "text-red-400" : "text-green-400"}`}>
        {isExpense ? "-" : "+"}{formatCurrency(amount, currency)}
      </p>

      {/* Menú ⋯ — deshabilitado para transacciones de fotografía (se gestionan desde ahí) */}
      {isPhotography ? (
        <div className="w-[26px] flex-shrink-0" />
      ) : (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-700 hover:text-neutral-300 transition-colors"
            title="Opciones"
          >
            <LuEllipsis size={15} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirmingDelete(false); }} />
              <div className="absolute right-0 bottom-full z-20 mb-1 flex flex-col overflow-hidden rounded-lg bg-neutral-700 shadow-lg">
                {!confirmingDelete ? (
                  <>
                    <button
                      onClick={() => { setMenuOpen(false); setEditing(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-200 hover:bg-neutral-600"
                    >
                      <LuPencil size={13} />
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-neutral-600"
                    >
                      <LuTrash2 size={13} />
                      Eliminar
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-1 p-2 w-44">
                    <p className="px-2 py-1 text-xs text-neutral-400">¿Eliminar esta transacción?</p>
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmingDelete(false); handleDelete(); }}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-md bg-neutral-600 px-3 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-500"
                    >
                      Cancelar
                    </button>
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
