"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EJEMPLOS: Record<string, string[]> = {
  STOCK: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "GGAL", "YPF"],
  CRYPTO: ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD"],
};

export default function InversionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"STOCK" | "CRYPTO">("STOCK");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      ticker: (form.elements.namedItem("ticker") as HTMLInputElement).value.trim().toUpperCase(),
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      type,
      quantity: (form.elements.namedItem("quantity") as HTMLInputElement).value,
      avgBuyPrice: (form.elements.namedItem("avgBuyPrice") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/finanzas/inversiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error al guardar la inversión");
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
        <span className="text-lg">+</span> Agregar inversión
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-neutral-800 p-6 ring-1 ring-blue-500">
      <p className="mb-4 text-sm font-medium text-white">Nueva inversión</p>

      {/* Tipo */}
      <div className="mb-4 flex gap-2">
        {(["STOCK", "CRYPTO"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
              type === t
                ? "bg-blue-600 text-white"
                : "bg-neutral-700 text-neutral-400 hover:text-white"
            }`}
          >
            {t === "STOCK" ? "📈 Acción" : "🪙 Crypto"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ticker" className="mb-1.5 block text-sm text-neutral-400">
            Ticker / Symbol
          </label>
          <input
            id="ticker"
            name="ticker"
            type="text"
            required
            placeholder={type === "STOCK" ? "ej: AAPL, GGAL" : "ej: BTC-USD, ETH-USD"}
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm uppercase text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-neutral-600">
            {EJEMPLOS[type].slice(0, 4).join(" · ")}
          </p>
        </div>

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm text-neutral-400">
            Nombre <span className="text-neutral-600">(opcional)</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder={type === "STOCK" ? "ej: Apple Inc." : "ej: Bitcoin"}
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="quantity" className="mb-1.5 block text-sm text-neutral-400">
            Cantidad
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            required
            min="0.000001"
            step="any"
            placeholder="ej: 10"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="avgBuyPrice" className="mb-1.5 block text-sm text-neutral-400">
            Precio promedio de compra (USD)
          </label>
          <input
            id="avgBuyPrice"
            name="avgBuyPrice"
            type="number"
            required
            min="0.000001"
            step="any"
            placeholder="ej: 150.00"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Agregar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg bg-neutral-700 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-600"
        >
          Cancelar
        </button>
      </div>

      <p className="mt-3 text-xs text-neutral-600">
        Si ya tenés ese ticker cargado, se acumulará ajustando el precio promedio automáticamente.
      </p>
    </form>
  );
}
