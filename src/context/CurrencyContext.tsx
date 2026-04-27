"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Currency = "ARS" | "USD";

interface CurrencyCtx {
  currency: Currency;
  toggle: () => void;
  usdArs: number;
  /** Formatea un monto según la moneda de visualización activa */
  fmt: (amount: number, origCurrency?: Currency) => string;
  /** Convierte un monto de su moneda original a la moneda de visualización */
  convert: (amount: number, origCurrency: Currency) => number;
}

const Ctx = createContext<CurrencyCtx | null>(null);

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export function CurrencyProvider({ children, usdArs }: { children: ReactNode; usdArs: number }) {
  const [currency, setCurrency] = useState<Currency>("ARS");

  useEffect(() => {
    const stored = localStorage.getItem("liford_currency");
    if (stored === "ARS" || stored === "USD") setCurrency(stored);
  }, []);

  function toggle() {
    setCurrency((c) => {
      const next = c === "ARS" ? "USD" : "ARS";
      localStorage.setItem("liford_currency", next);
      return next;
    });
  }

  function convert(amount: number, origCurrency: Currency): number {
    if (origCurrency === currency) return amount;
    if (origCurrency === "ARS" && currency === "USD") return amount / usdArs;
    return amount * usdArs;
  }

  function fmt(amount: number, origCurrency: Currency = "ARS"): string {
    const display = convert(amount, origCurrency);
    return currency === "ARS" ? fmtARS(display) : fmtUSD(display);
  }

  return (
    <Ctx.Provider value={{ currency, toggle, usdArs, fmt, convert }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
