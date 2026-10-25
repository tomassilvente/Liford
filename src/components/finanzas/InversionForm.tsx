"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuTrendingUp, LuCoins, LuPlus } from "react-icons/lu";

const EJEMPLOS: Record<string, string[]> = {
  STOCK_USD: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "MELI"],
  STOCK_ARS: ["MELI.BA", "GGAL.BA", "YPF.BA", "PAMP.BA", "BMA.BA"],
  CRYPTO: ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD"],
};

export default function InversionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"STOCK" | "CRYPTO">("STOCK");
  const [market, setMarket] = useState<"USD" | "ARS">("USD");

  const currency = type === "CRYPTO" ? "USD" : market;
  const exampleKey = type === "CRYPTO" ? "CRYPTO" : type === "STOCK" && currency === "ARS" ? "STOCK_ARS" : "STOCK_USD";
  const tickerPlaceholder = currency === "ARS" ? "ej: MELI.BA, GGAL.BA" : type === "CRYPTO" ? "ej: BTC-USD, ETH-USD" : "ej: AAPL, MELI";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      ticker: (form.elements.namedItem("ticker") as HTMLInputElement).value.trim().toUpperCase(),
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      type,
      currency,
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
        <LuPlus size={16} /> Agregar inversión
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-neutral-800 p-6 ring-1 ring-blue-500">
      <p className="mb-4 text-sm font-medium text-white">Nueva inversión</p>

      {/* Tipo: Acción / Crypto */}
      <div className="mb-3 flex gap-2">
        {(["STOCK", "CRYPTO"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
              type === t
                ? "bg-blue-600 text-white"
                : "bg-neutral-700 text-neutral-400 hover:text-white"
            }`}
          >
            {t === "STOCK" ? <LuTrendingUp size={13} /> : <LuCoins size={13} />}
            {t === "STOCK" ? "Acción" : "Crypto"}
          </button>
        ))}
      </div>

      {/* Mercado: USD / ARS — solo para acciones */}
      {type === "STOCK" && (
        <div className="mb-4">
          <p className="mb-1.5 text-xs text-neutral-500">Mercado</p>
          <div className="flex gap-2">
            {(["USD", "ARS"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMarket(m)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  market === m
                    ? "bg-neutral-600 text-white"
                    : "bg-neutral-700 text-neutral-400 hover:text-white"
                }`}
              >
                {m === "USD" ? "🇺🇸 EE.UU. (USD)" : "🇦🇷 Argentina (ARS)"}
              </button>
            ))}
          </div>
          {market === "ARS" && (
            <p className="mt-1.5 text-xs text-neutral-500">
              CEDEARs — usá el ticker con sufijo .BA (ej: MELI.BA)
            </p>
          )}
        </div>
      )}

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
            placeholder={tickerPlaceholder}
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm uppercase text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-neutral-600">
            {EJEMPLOS[exampleKey].slice(0, 4).join(" · ")}
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
            placeholder={currency === "ARS" ? "ej: MercadoLibre CEDEAR" : type === "CRYPTO" ? "ej: Bitcoin" : "ej: Apple Inc."}
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
            Precio promedio de compra ({currency})
          </label>
          <input
            id="avgBuyPrice"
            name="avgBuyPrice"
            type="number"
            required
            min="0.000001"
            step="any"
            placeholder={currency === "ARS" ? "ej: 24995" : "ej: 150.00"}
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
        Si ya tenés ese ticker en la misma moneda, se acumulará ajustando el precio promedio.
      </p>
    </form>
  );
}
