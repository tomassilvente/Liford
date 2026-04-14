"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import type { ForeignAccountModel as ForeignAccount } from "@/generated/prisma/models";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ForeignAccountCard({ account }: { account: ForeignAccount }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [balance, setBalance] = useState(String(account.balance));
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/finanzas/foreign-accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, balance }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar la cuenta "${account.name}"?`)) return;
    await fetch(`/api/finanzas/foreign-accounts/${account.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editing) {
    return (
      <div className="rounded-xl bg-neutral-800 p-5 ring-1 ring-blue-500">
        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Saldo ({account.currency})</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              step="0.01"
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg bg-neutral-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl bg-neutral-800 p-5 ring-1 ring-neutral-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-400">{account.name}</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatCurrency(account.balance, account.currency)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
              {account.currency}
            </span>
            <span className="text-xs text-neutral-500">Cuenta foránea</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            title="Editar"
          >
            <LuPencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-red-400"
            title="Eliminar"
          >
            <LuTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
