"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuCheck, LuChevronRight, LuSkipForward, LuPlus, LuX } from "react-icons/lu";
import { toast } from "sonner";

interface Props {
  username: string;
}

type Step = 0 | 1 | 2 | 3;

const STEPS = [
  { label: "Bienvenida",  short: "Hola" },
  { label: "Cuentas",     short: "Cuentas" },
  { label: "Categorías",  short: "Cats." },
  { label: "Primer ingreso", short: "Ingreso" },
];

const DEFAULT_CATS_GASTO  = ["Alimentación", "Transporte", "Entretenimiento", "Salud", "Servicios", "Suscripciones"];
const DEFAULT_CATS_INGRESO = ["Sueldo", "Freelance", "Fotografía", "Inversión"];

const INPUT = "rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500";

export default function OnboardingWizard({ username }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Cuentas
  const [wallets, setWallets] = useState<{ name: string; currency: "ARS" | "USD"; balance: string }[]>([
    { name: "Efectivo", currency: "ARS", balance: "" },
    { name: "Mercado Pago", currency: "ARS", balance: "" },
  ]);

  // Step 2 — Categorías
  const [selectedCats, setSelectedCats] = useState<Set<string>>(
    new Set(DEFAULT_CATS_GASTO)
  );
  const [customCat, setCustomCat] = useState("");

  // Step 3 — Primer ingreso recurrente
  const [income, setIncome] = useState({ description: "Sueldo", amount: "", currency: "ARS" as "ARS" | "USD", dayOfMonth: "1" });
  const [skipIncome, setSkipIncome] = useState(false);

  async function complete() {
    setSaving(true);
    try {
      // Crear wallets
      for (const w of wallets.filter((w) => w.name)) {
        await fetch("/api/finanzas/wallets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: w.name, currency: w.currency, balance: Number(w.balance) || 0 }),
        });
      }

      // Crear categorías seleccionadas
      for (const name of selectedCats) {
        await fetch("/api/finanzas/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type: DEFAULT_CATS_INGRESO.includes(name) ? "INCOME" : "EXPENSE" }),
        }).catch(() => {});
      }

      // Crear ingreso recurrente si no se saltea
      if (!skipIncome && income.description && income.amount) {
        await fetch("/api/finanzas/recurrentes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionType: "INCOME",
            description: income.description,
            amount: Number(income.amount),
            currency: income.currency,
            category: "Sueldo",
            dayOfMonth: Number(income.dayOfMonth),
          }),
        });
      }

      // Marcar onboarding completo
      await fetch("/api/auth/onboarding", { method: "POST" });

      toast.success("¡Todo listo! Bienvenido a Liford.");
      router.push("/finanzas");
    } catch {
      toast.error("Algo salió mal. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function skip() {
    await fetch("/api/auth/onboarding", { method: "POST" });
    router.push("/finanzas");
  }

  function addWallet() {
    setWallets((prev) => [...prev, { name: "", currency: "ARS", balance: "" }]);
  }

  function removeWallet(i: number) {
    setWallets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleCat(name: string) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function addCustomCat() {
    if (!customCat.trim()) return;
    setSelectedCats((prev) => new Set([...prev, customCat.trim()]));
    setCustomCat("");
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-colors ${i <= step ? "bg-blue-500" : "bg-neutral-800"}`} />
              <p className={`text-[10px] font-medium transition-colors hidden sm:block ${i === step ? "text-blue-400" : i < step ? "text-neutral-500" : "text-neutral-700"}`}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Step 0 — Bienvenida */}
        {step === 0 && (
          <div className="text-center">
            <p className="text-4xl mb-4">👋</p>
            <h1 className="text-3xl font-bold text-white mb-3">Hola, {username}.</h1>
            <p className="text-neutral-400 mb-2">Bienvenido a Liford.</p>
            <p className="text-neutral-500 text-sm mb-8 max-w-sm mx-auto">
              En 3 pasos rápidos configuramos tus cuentas, categorías y primer ingreso para que el dashboard tenga sentido desde el día uno.
            </p>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors mx-auto"
            >
              Empezar <LuChevronRight size={16} />
            </button>
            <button onClick={skip} className="mt-4 block mx-auto text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              Saltar configuración
            </button>
          </div>
        )}

        {/* Step 1 — Cuentas */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Tus cuentas</h2>
            <p className="text-sm text-neutral-500 mb-6">Agregá tus billeteras y cuentas. Podés agregar más después.</p>

            <div className="space-y-3 mb-4">
              {wallets.map((w, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={w.name}
                    onChange={(e) => setWallets((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                    placeholder="Nombre (ej: Mercado Pago)"
                    className={`${INPUT} flex-1`}
                  />
                  <select
                    value={w.currency}
                    onChange={(e) => setWallets((prev) => prev.map((x, idx) => idx === i ? { ...x, currency: e.target.value as "ARS" | "USD" } : x))}
                    className={`${INPUT} w-20`}
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    type="number"
                    value={w.balance}
                    onChange={(e) => setWallets((prev) => prev.map((x, idx) => idx === i ? { ...x, balance: e.target.value } : x))}
                    placeholder="Saldo"
                    className={`${INPUT} w-28`}
                  />
                  {wallets.length > 1 && (
                    <button onClick={() => removeWallet(i)} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-800 hover:text-red-400 transition-colors">
                      <LuX size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addWallet} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors mb-8">
              <LuPlus size={14} /> Agregar cuenta
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
                Continuar <LuChevronRight size={15} />
              </button>
              <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
                <LuSkipForward size={14} /> Saltar
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Categorías */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Categorías</h2>
            <p className="text-sm text-neutral-500 mb-6">Elegí las que usás. Las podés editar y agregar más en Configuración → Categorías.</p>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-3">Gastos</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {DEFAULT_CATS_GASTO.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedCats.has(c) ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    }`}
                  >
                    {selectedCats.has(c) && <LuCheck size={11} className="inline mr-1" />}{c}
                  </button>
                ))}
              </div>

              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-3">Ingresos</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {DEFAULT_CATS_INGRESO.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedCats.has(c) ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    }`}
                  >
                    {selectedCats.has(c) && <LuCheck size={11} className="inline mr-1" />}{c}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <input
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  placeholder="Agregar categoría personalizada..."
                  className={`${INPUT} flex-1`}
                  onKeyDown={(e) => e.key === "Enter" && addCustomCat()}
                />
                <button onClick={addCustomCat} className="rounded-lg bg-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-600 transition-colors">
                  <LuPlus size={14} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
                Continuar <LuChevronRight size={15} />
              </button>
              <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
                <LuSkipForward size={14} /> Saltar
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Primer ingreso */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Primer ingreso recurrente</h2>
            <p className="text-sm text-neutral-500 mb-6">Tu sueldo o ingreso fijo mensual para que el dashboard tenga sentido.</p>

            {!skipIncome ? (
              <div className="space-y-3 mb-6">
                <input
                  value={income.description}
                  onChange={(e) => setIncome({ ...income, description: e.target.value })}
                  placeholder="Descripción (ej: Sueldo empresa)"
                  className={`${INPUT} w-full`}
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={income.amount}
                    onChange={(e) => setIncome({ ...income, amount: e.target.value })}
                    placeholder="Monto"
                    className={`${INPUT} flex-1`}
                  />
                  <select
                    value={income.currency}
                    onChange={(e) => setIncome({ ...income, currency: e.target.value as "ARS" | "USD" })}
                    className={`${INPUT} w-24`}
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-neutral-500">¿Qué día del mes te acreditás?</p>
                  <select
                    value={income.dayOfMonth}
                    onChange={(e) => setIncome({ ...income, dayOfMonth: e.target.value })}
                    className={`${INPUT} w-full`}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>Día {d}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-xl bg-neutral-800/50 p-4 text-center">
                <p className="text-sm text-neutral-500">Podés agregar ingresos recurrentes después desde <span className="text-white">Transacciones → Nueva transacción</span>.</p>
              </div>
            )}

            <button
              onClick={() => setSkipIncome((v) => !v)}
              className="mb-6 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              {skipIncome ? "← Quiero agregar un ingreso" : "No tengo ingreso fijo, saltar"}
            </button>

            <div className="flex gap-3">
              <button
                onClick={complete}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {saving ? "Configurando..." : <><LuCheck size={15} /> Finalizar</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
