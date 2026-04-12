"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WalletModel as Wallet } from "@/generated/prisma/models";

const CATEGORIAS = [
  "Sueldo",
  "Freelance",
  "Venta",
  "Inversión",
  "Transferencia recibida",
  "Reembolso",
  "Otro",
];

interface IngresoFormProps {
  wallets: Wallet[];
}

export default function IngresoForm({ wallets }: IngresoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      description: (form.elements.namedItem("description") as HTMLInputElement).value,
      amount: (form.elements.namedItem("amount") as HTMLInputElement).value,
      category: (form.elements.namedItem("category") as HTMLSelectElement).value,
      walletId: (form.elements.namedItem("walletId") as HTMLSelectElement).value,
      date: (form.elements.namedItem("date") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/finanzas/ingresos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error al guardar el ingreso");
      }

      form.reset();
      (form.elements.namedItem("date") as HTMLInputElement).value = today;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (wallets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center">
        <p className="text-neutral-400">Primero necesitás agregar una billetera para registrar ingresos.</p>
        <a href="/finanzas/billeteras" className="mt-3 inline-block text-sm text-blue-400 hover:underline">
          Ir a Billeteras →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-neutral-800 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="description" className="mb-1.5 block text-sm text-neutral-400">
            Descripción
          </label>
          <input
            id="description"
            name="description"
            type="text"
            required
            placeholder="ej: Sueldo de marzo, Proyecto cliente X..."
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-sm text-neutral-400">
            Monto
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            required
            min="0.01"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="date" className="mb-1.5 block text-sm text-neutral-400">
            Fecha
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            required
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm text-neutral-400">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          >
            <option value="" disabled>Seleccioná una categoría</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="walletId" className="mb-1.5 block text-sm text-neutral-400">
            Acreditar en
          </label>
          <select
            id="walletId"
            name="walletId"
            required
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          >
            <option value="" disabled>Seleccioná una billetera</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.currency})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Registrar ingreso"}
      </button>
    </form>
  );
}
