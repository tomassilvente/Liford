"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuPlus } from "react-icons/lu";

export default function ForeignAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch("/api/finanzas/foreign-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error al crear la cuenta");
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
        className="flex items-center gap-2 rounded-xl border border-dashed border-neutral-700 px-5 py-4 text-sm text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
      >
        <LuPlus size={16} /> Agregar cuenta foránea
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-neutral-800 p-5 ring-1 ring-blue-500">
      <p className="mb-4 text-sm font-medium text-white">Nueva cuenta foránea</p>
      <div className="flex flex-col gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="ej: Payoneer, Wise, Deel..."
          className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
        />
        <div className="flex gap-3">
          <select
            name="currency"
            required
            className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          >
            <option value="USD">USD — Dólares</option>
            <option value="ARS">ARS — Pesos</option>
          </select>
          <input
            name="balance"
            type="number"
            step="0.01"
            defaultValue="0"
            placeholder="Saldo"
            className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Crear cuenta"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-neutral-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
