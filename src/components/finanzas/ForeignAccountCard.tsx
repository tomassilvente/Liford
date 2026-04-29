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

const inputStyle: React.CSSProperties = {
  background: "var(--paper)",
  border: "1px solid var(--rule2)",
  fontFamily: "var(--font-serif)",
  fontSize: 14,
  color: "var(--ink)",
  padding: "8px 10px",
  outline: "none",
  width: "100%",
};

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
      <div style={{ background: "var(--paper2)", border: "1px solid var(--ink)", padding: 20 }}>
        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <div>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", display: "block", marginBottom: 4 }}>Saldo ({account.currency})</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              step="0.01"
              style={inputStyle}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "8px 16px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.5 : 1 }}
            >
              Guardar
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{ background: "var(--paper3)", color: "var(--ink2)", border: "1px solid var(--rule2)", padding: "8px 16px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative" style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: 20 }}>
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink2)" }}>{account.name}</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>
            {formatCurrency(account.balance, account.currency)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", background: "var(--paper3)", padding: "2px 6px" }}>
              {account.currency}
            </span>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 11, fontStyle: "italic", color: "var(--ink3)" }}>Cuenta foránea</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            style={{ color: "var(--ink3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
            title="Editar"
          >
            <LuPencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            style={{ color: "var(--ink3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
            title="Eliminar"
          >
            <LuTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
