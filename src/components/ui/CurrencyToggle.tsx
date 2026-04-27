"use client";

import { useCurrency } from "@/context/CurrencyContext";

export default function CurrencyToggle() {
  const { currency, toggle, usdArs } = useCurrency();

  return (
    <button
      onClick={toggle}
      title={`Cotización blue: $${usdArs.toFixed(0)}`}
      className="flex items-center gap-1 rounded-lg bg-neutral-800 px-2.5 py-1.5 text-[11px] font-medium ring-1 ring-neutral-700 transition-colors hover:bg-neutral-700"
    >
      <span className={currency === "ARS" ? "text-white" : "text-neutral-500"}>ARS</span>
      <span className="text-neutral-600">/</span>
      <span className={currency === "USD" ? "text-white" : "text-neutral-500"}>USD</span>
      <span className="ml-1 text-neutral-600 text-[10px]">@{usdArs.toFixed(0)}</span>
    </button>
  );
}
