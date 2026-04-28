"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LuPencil, LuTrash2, LuCheck, LuX } from "react-icons/lu";
import { toast } from "sonner";
import type { WalletModel as Wallet } from "@/generated/prisma/models";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function WalletCard({ wallet }: { wallet: Wallet }) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [editingBalance, setEditingBalance] = useState(false);
  const [name, setName] = useState(wallet.name);
  const [balance, setBalance] = useState(String(wallet.balance));
  const [loading, setLoading] = useState(false);
  const balanceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingBalance) balanceInputRef.current?.select();
  }, [editingBalance]);

  async function saveBalance() {
    const newBalance = Number(balance);
    if (isNaN(newBalance)) { setBalance(String(wallet.balance)); setEditingBalance(false); return; }
    if (newBalance === wallet.balance) { setEditingBalance(false); return; }

    setLoading(true);
    const res = await fetch(`/api/finanzas/wallets/${wallet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: newBalance }),
    });
    setLoading(false);
    setEditingBalance(false);

    if (res.ok) {
      toast.success("Saldo actualizado");
      router.refresh();
    } else {
      toast.error("No se pudo actualizar");
      setBalance(String(wallet.balance));
    }
  }

  async function saveName() {
    if (!name.trim()) { setName(wallet.name); setEditingName(false); return; }
    setLoading(true);
    const res = await fetch(`/api/finanzas/wallets/${wallet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    setEditingName(false);
    if (res.ok) { router.refresh(); }
    else { toast.error("No se pudo actualizar"); setName(wallet.name); }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar la billetera "${wallet.name}"?`)) return;
    await fetch(`/api/finanzas/wallets/${wallet.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="group relative rounded-xl bg-neutral-800 p-5">

      {/* Fila superior: nombre + botón eliminar */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {editingName ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setName(wallet.name); setEditingName(false); } }}
              autoFocus
              className="rounded-lg bg-neutral-900 px-2 py-1 text-sm text-white outline-none ring-1 ring-blue-500 w-full"
            />
            <button onClick={saveName} disabled={loading} className="text-green-400 hover:text-green-300 flex-shrink-0"><LuCheck size={15} /></button>
            <button onClick={() => { setName(wallet.name); setEditingName(false); }} className="text-neutral-500 hover:text-neutral-300 flex-shrink-0"><LuX size={15} /></button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors text-left"
          >
            {wallet.name}
          </button>
        )}

        <button
          onClick={handleDelete}
          className="rounded-lg p-1.5 text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-700 hover:text-red-400 flex-shrink-0"
          title="Eliminar billetera"
        >
          <LuTrash2 size={14} />
        </button>
      </div>

      {/* Monto — ocupa todo el ancho */}
      {editingBalance ? (
        <input
          ref={balanceInputRef}
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveBalance(); if (e.key === "Escape") { setBalance(String(wallet.balance)); setEditingBalance(false); } }}
          onBlur={saveBalance}
          step="0.01"
          className="w-full rounded-lg bg-neutral-900 px-3 py-1.5 text-2xl font-bold text-white outline-none ring-1 ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <button
          onClick={() => { setBalance(String(wallet.balance)); setEditingBalance(true); }}
          title="Tocar para editar el saldo"
          className={`text-left text-2xl font-bold tabular-nums transition-colors hover:opacity-70 ${
            wallet.balance < 0 ? "text-red-400" : "text-white"
          }`}
        >
          {formatCurrency(wallet.balance, wallet.currency)}
        </button>
      )}

      {/* Badge moneda */}
      <span className="mt-2 inline-block rounded-full bg-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
        {wallet.currency}
      </span>

      {/* Hint */}
      {!editingBalance && !editingName && (
        <p className="mt-2 flex items-center gap-1 text-xs text-neutral-700">
          <LuPencil size={10} />
          Tocá el saldo o el nombre para editar
        </p>
      )}
    </div>
  );
}
