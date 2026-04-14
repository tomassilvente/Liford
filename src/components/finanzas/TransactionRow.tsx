"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuPencil, LuTrash2, LuCheck, LuX } from "react-icons/lu";

interface TransactionRowProps {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  currency: string;
  type: "EXPENSE" | "INCOME";
  categories: string[];
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
}: TransactionRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(description);
  const [cat, setCat] = useState(category);
  const [amt, setAmt] = useState(String(amount));
  const [loading, setLoading] = useState(false);

  const isExpense = type === "EXPENSE";

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/finanzas/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc, category: cat, amount: amt }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${description}"?`)) return;
    await fetch(`/api/finanzas/transactions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 bg-neutral-750 px-4 py-3">
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

  return (
    <div className="group flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{description}</p>
          <p className="text-xs text-neutral-500">
            {category} · {formatDate(date)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        <p className={`text-sm font-semibold ${isExpense ? "text-red-400" : "text-green-400"}`}>
          {isExpense ? "-" : "+"}{formatCurrency(amount, currency)}
        </p>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            title="Editar"
          >
            <LuPencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-red-400"
            title="Eliminar"
          >
            <LuTrash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
