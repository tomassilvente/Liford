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
    <div className="group relative" style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: 20 }}>

      {/* Fila superior: nombre + botón eliminar */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {editingName ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setName(wallet.name); setEditingName(false); } }}
              autoFocus
              style={{ background: "var(--paper)", border: "1px solid var(--ink)", fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink)", padding: "4px 8px", outline: "none", flex: 1 }}
            />
            <button onClick={saveName} disabled={loading} style={{ color: "var(--olive)", flexShrink: 0 }}><LuCheck size={15} /></button>
            <button onClick={() => { setName(wallet.name); setEditingName(false); }} style={{ color: "var(--ink3)", flexShrink: 0 }}><LuX size={15} /></button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink2)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
          >
            {wallet.name}
          </button>
        )}

        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{ color: "var(--ink3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
          title="Eliminar billetera"
        >
          <LuTrash2 size={14} />
        </button>
      </div>

      {/* Monto */}
      {editingBalance ? (
        <input
          ref={balanceInputRef}
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveBalance(); if (e.key === "Escape") { setBalance(String(wallet.balance)); setEditingBalance(false); } }}
          onBlur={saveBalance}
          step="0.01"
          style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--ink)", fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--ink)", padding: "4px 8px", outline: "none" }}
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <button
          onClick={() => { setBalance(String(wallet.balance)); setEditingBalance(true); }}
          title="Tocar para editar el saldo"
          style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: wallet.balance < 0 ? "var(--brick)" : "var(--ink)", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
        >
          {formatCurrency(wallet.balance, wallet.currency)}
        </button>
      )}

      {/* Badge moneda */}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", background: "var(--paper3)", padding: "2px 6px", display: "inline-block", marginTop: 8 }}>
        {wallet.currency}
      </span>

      {/* Hint */}
      {!editingBalance && !editingName && (
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 10, fontStyle: "italic", color: "var(--ink3)", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <LuPencil size={10} />
          Tocá el saldo o el nombre para editar
        </p>
      )}
    </div>
  );
}
