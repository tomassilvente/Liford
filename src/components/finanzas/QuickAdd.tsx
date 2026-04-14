"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LuPlus, LuX, LuCheck, LuLoader } from "react-icons/lu";

const CATEGORIAS = [
  "Alimentación", "Transporte", "Entretenimiento", "Salud",
  "Servicios", "Ropa", "Educación", "Suscripciones", "Otro",
];

const INPUT = "rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500 w-full";

export default function QuickAdd() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => amountRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function reset() {
    setAmount(""); setCategory(""); setDescription("");
    setType("EXPENSE"); setCurrency("ARS");
  }

  async function handleSubmit() {
    if (!amount || !category) return;
    setSaving(true);
    await fetch("/api/finanzas/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: Number(amount),
        currency,
        category,
        description,
        source: "PERSONAL",
        date: new Date().toISOString(),
      }),
    });
    setSaving(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-blue-600 shadow-lg hover:bg-blue-500 transition-colors lg:bottom-6"
        title="Registrar transacción rápida"
        style={{ width: 52, height: 52 }}
      >
        <LuPlus size={22} className="text-white" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-neutral-900 p-5 shadow-2xl lg:bottom-auto lg:left-auto lg:right-6 lg:top-1/2 lg:-translate-y-1/2 lg:w-80 lg:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Registrar transacción</p>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-neutral-500 hover:text-white">
              <LuX size={16} />
            </button>
          </div>

          {/* Type toggle */}
          <div className="mb-4 flex rounded-lg bg-neutral-800 p-1">
            <button
              onClick={() => setType("EXPENSE")}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${type === "EXPENSE" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"}`}
            >
              Gasto
            </button>
            <button
              onClick={() => setType("INCOME")}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${type === "INCOME" ? "bg-green-600 text-white" : "text-neutral-400 hover:text-white"}`}
            >
              Ingreso
            </button>
          </div>

          <div className="space-y-2">
            {/* Amount + currency */}
            <div className="flex gap-2">
              <input
                ref={amountRef}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto"
                className={INPUT}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-lg bg-neutral-800 px-2 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500">
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            {/* Category */}
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT}>
              <option value="">Categoría</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Description */}
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className={INPUT}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !amount || !category}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {saving ? <LuLoader size={15} className="animate-spin" /> : <LuCheck size={15} />}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
    </>
  );
}
