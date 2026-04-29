"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuPlus } from "react-icons/lu";

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

export default function WalletForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      currency: (form.elements.namedItem("currency") as HTMLSelectElement).value,
      balance: (form.elements.namedItem("balance") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/finanzas/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error al crear la billetera");
      }

      form.reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: 8, border: "1px dashed var(--rule2)", padding: "16px 20px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", background: "transparent", cursor: "pointer", width: "100%" }}
      >
        <LuPlus size={16} /> Agregar billetera
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--paper2)", border: "1px solid var(--ink)", padding: 20 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink2)", margin: "0 0 16px" }}>Nueva billetera</p>
      <div className="flex flex-col gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="ej: Mercado Pago, Ualá, Efectivo..."
          style={inputStyle}
        />
        <div className="flex gap-3">
          <select
            name="currency"
            required
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="ARS">ARS — Pesos</option>
            <option value="USD">USD — Dólares</option>
          </select>
          <input
            name="balance"
            type="number"
            step="0.01"
            defaultValue="0"
            placeholder="Saldo inicial"
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
        {error && <p style={{ fontFamily: "var(--font-serif)", fontSize: 12, color: "var(--brick)" }}>{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "8px 16px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.5 : 1 }}
          >
            {loading ? "Guardando..." : "Crear billetera"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ background: "var(--paper3)", color: "var(--ink2)", border: "1px solid var(--rule2)", padding: "8px 16px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
