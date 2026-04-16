"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LuPlus, LuX, LuCheck, LuLoader } from "react-icons/lu";
import { toast } from "sonner";

const CATEGORIAS_GASTO = [
  "Alimentación", "Transporte", "Entretenimiento", "Salud",
  "Servicios", "Ropa", "Educación", "Suscripciones", "Otro",
];
const CATEGORIAS_INGRESO = [
  "Sueldo", "Freelance", "Fotografía", "Venta", "Inversión",
  "Transferencia recibida", "Reembolso", "Otro",
];

const INPUT = "rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500 w-full";

interface Account {
  id: string;
  name: string;
  currency: string;
}

interface QuickAddProps {
  wallets: Account[];
  foreignAccounts: Account[];
}

export default function QuickAdd({ wallets, foreignAccounts }: QuickAddProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [accountRaw, setAccountRaw] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  const categorias = type === "EXPENSE" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO;

  // Reset category when type changes
  useEffect(() => { setCategory(""); }, [type]);

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
    setAmount(""); setCategory(""); setDescription(""); setAccountRaw("");
    setType("EXPENSE");
  }

  async function handleSubmit() {
    if (!amount || !category || !accountRaw) return;

    const [accountType, accountId] = accountRaw.split(":");
    const endpoint = type === "EXPENSE" ? "/api/finanzas/gastos" : "/api/finanzas/ingresos";
    const body = {
      type,
      amount: Number(amount),
      category,
      description,
      date: new Date().toISOString(),
      ...(accountType === "w" ? { walletId: accountId } : { foreignAccountId: accountId }),
    };

    setSaving(true);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      toast.success(type === "EXPENSE" ? "Gasto registrado" : "Ingreso registrado");
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error("No se pudo guardar. Intentá de nuevo.");
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-5 z-40 flex items-center justify-center rounded-full bg-blue-600 shadow-lg hover:bg-blue-500 transition-colors lg:left-auto lg:right-5 lg:bottom-6"
        style={{ width: 52, height: 52 }}
        title="Registrar transacción rápida"
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
            {/* Monto */}
            <input
              ref={amountRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Monto"
              className={INPUT}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />

            {/* Cuenta — wallets + foreign accounts agrupadas */}
            <select
              value={accountRaw}
              onChange={(e) => setAccountRaw(e.target.value)}
              className={INPUT}
            >
              <option value="">Cuenta</option>
              {wallets.length > 0 && (
                <optgroup label="Billeteras">
                  {wallets.map((w) => (
                    <option key={w.id} value={`w:${w.id}`}>
                      {w.name} ({w.currency})
                    </option>
                  ))}
                </optgroup>
              )}
              {foreignAccounts.length > 0 && (
                <optgroup label="Cuentas foráneas">
                  {foreignAccounts.map((a) => (
                    <option key={a.id} value={`f:${a.id}`}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Categoría */}
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT}>
              <option value="">Categoría</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Descripción */}
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
            disabled={saving || !amount || !category || !accountRaw}
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
