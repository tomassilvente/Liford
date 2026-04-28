"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LuPlus, LuX, LuCheck, LuLoader, LuRepeat, LuSparkles } from "react-icons/lu";
import { toast } from "sonner";

const FALLBACK_GASTO = ["Alimentación","Transporte","Entretenimiento","Salud","Servicios","Ropa","Educación","Suscripciones","Otro"];
const FALLBACK_INGRESO = ["Sueldo","Freelance","Fotografía","Venta","Inversión","Transferencia recibida","Reembolso","Otro"];

const INPUT = "rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500 w-full";

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";
type DisplayCurrency = "ARS" | "USD" | "EUR";

interface Account { id: string; name: string; currency: string; }
interface Category { id: string; name: string; icon: string; type: string; }

interface QuickAddProps {
  wallets: Account[];
  foreignAccounts: Account[];
  categories: Category[];
}

interface Suggestion {
  category: string;
  accountId: string | null;
  accountType: "wallet" | "foreign" | null;
  confidence: "high" | "low";
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function QuickAdd({ wallets, foreignAccounts, categories }: QuickAddProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<TxType>("EXPENSE");
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("ARS");
  const [amount, setAmount] = useState("");
  const [accountRaw, setAccountRaw] = useState("");
  const [toAccountRaw, setToAccountRaw] = useState(""); // para Transfer
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const descRef = useRef<HTMLInputElement>(null);

  const catsByType = {
    EXPENSE: categories.filter((c) => c.type === "EXPENSE" || c.type === "BOTH").map((c) => c.name),
    INCOME:  categories.filter((c) => c.type === "INCOME"  || c.type === "BOTH").map((c) => c.name),
  };
  const categorias =
    type === "EXPENSE" ? (catsByType.EXPENSE.length > 0 ? catsByType.EXPENSE : FALLBACK_GASTO)
    : type === "INCOME" ? (catsByType.INCOME.length  > 0 ? catsByType.INCOME  : FALLBACK_INGRESO)
    : [];
  const debouncedDesc = useDebounce(description, 350);

  useEffect(() => { setCategory(""); setSuggestion(null); }, [type]);

  useEffect(() => {
    if (open) setTimeout(() => descRef.current?.focus(), 50);
  }, [open]);

  // Atajos de teclado globales
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); return; }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey) {
        if (e.key === "G" || e.key === "g") { e.preventDefault(); setType("EXPENSE"); setOpen(true); }
        if (e.key === "I" || e.key === "i") { e.preventDefault(); setType("INCOME"); setOpen(true); }
        if (e.key === "T" || e.key === "t") { e.preventDefault(); setType("TRANSFER"); setOpen(true); }
      }
      // ⌘+Enter para guardar
      if (mod && e.key === "Enter" && open) { e.preventDefault(); submit(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Sugerencia desde historial
  useEffect(() => {
    if (type === "TRANSFER" || !debouncedDesc || debouncedDesc.trim().length < 2) {
      setSuggestion(null); return;
    }
    setLoadingSuggestion(true);
    fetch(`/api/finanzas/transactions/suggest?q=${encodeURIComponent(debouncedDesc)}&type=${type}`)
      .then((r) => r.json())
      .then((data: Suggestion | null) => {
        setSuggestion(data);
        if (data) {
          if (!category) setCategory(data.category);
          if (!accountRaw && data.accountId && data.accountType) {
            setAccountRaw(`${data.accountType === "wallet" ? "w" : "f"}:${data.accountId}`);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSuggestion(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDesc, type]);

  function reset() {
    setAmount(""); setCategory(""); setDescription(""); setAccountRaw(""); setToAccountRaw("");
    setSuggestion(null); setType("EXPENSE"); setDisplayCurrency("ARS");
  }

  const submit = useCallback(async (andAnother = false) => {
    if (!amount || !accountRaw) return;
    if (type !== "TRANSFER" && !category) return;
    if (type === "TRANSFER" && !toAccountRaw) return;

    const [accountType, accountId] = accountRaw.split(":");

    let endpoint = type === "EXPENSE" ? "/api/finanzas/gastos" : "/api/finanzas/ingresos";
    let body: Record<string, unknown>;

    if (type === "TRANSFER") {
      // Transfer: registra un gasto en la cuenta origen y un ingreso en la destino
      const [toType, toId] = toAccountRaw.split(":");
      endpoint = "/api/finanzas/gastos";
      body = {
        type: "EXPENSE",
        amount: Number(amount),
        category: "Transferencia",
        description: description || "Transferencia entre cuentas",
        date: new Date().toISOString(),
        ...(accountType === "w" ? { walletId: accountId } : { foreignAccountId: accountId }),
      };
      // Enviar ambas operaciones
      setSaving(true);
      const [resFrom, resTo] = await Promise.all([
        fetch("/api/finanzas/gastos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        fetch("/api/finanzas/ingresos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "INCOME",
            amount: Number(amount),
            category: "Transferencia recibida",
            description: description || "Transferencia entre cuentas",
            date: new Date().toISOString(),
            ...(toType === "w" ? { walletId: toId } : { foreignAccountId: toId }),
          }),
        }),
      ]);
      setSaving(false);
      if (resFrom.ok && resTo.ok) {
        toast.success("Transferencia registrada");
        if (andAnother) { setAmount(""); setDescription(""); setSuggestion(null); setTimeout(() => descRef.current?.focus(), 50); }
        else { setOpen(false); reset(); }
        router.refresh();
      } else {
        toast.error("No se pudo registrar la transferencia");
      }
      return;
    }

    body = {
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
      if (andAnother) {
        setAmount(""); setDescription(""); setSuggestion(null);
        setTimeout(() => descRef.current?.focus(), 50);
      } else {
        setOpen(false); reset();
      }
      router.refresh();
    } else {
      toast.error("No se pudo guardar. Intentá de nuevo.");
    }
  }, [amount, category, accountRaw, toAccountRaw, type, description, router]);

  const canSave = !!amount && (type === "TRANSFER" ? !!accountRaw && !!toAccountRaw : !!category && !!accountRaw);

  const TABS: { key: TxType; label: string; activeClass: string }[] = [
    { key: "EXPENSE",  label: "Gasto",     activeClass: "bg-red-600 text-white" },
    { key: "INCOME",   label: "Ingreso",   activeClass: "bg-green-600 text-white" },
    { key: "TRANSFER", label: "Transfer",  activeClass: "bg-blue-600 text-white" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-5 z-40 flex items-center justify-center rounded-full bg-blue-600 shadow-lg hover:bg-blue-500 transition-colors lg:left-auto lg:right-5 lg:bottom-6"
        style={{ width: 52, height: 52 }}
        title="Registrar transacción (⌘⇧G · ⌘⇧I · ⌘⇧T)"
      >
        <LuPlus size={22} className="text-white" />
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {open && (
        <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-neutral-900 p-5 shadow-2xl lg:bottom-auto lg:left-auto lg:right-6 lg:top-1/2 lg:-translate-y-1/2 lg:w-[340px] lg:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              Registrar {type === "EXPENSE" ? "gasto" : type === "INCOME" ? "ingreso" : "transferencia"}
            </p>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-neutral-500 hover:text-white">
              <LuX size={16} />
            </button>
          </div>

          {/* Tabs tipo */}
          <div className="mb-4 flex rounded-lg bg-neutral-800 p-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setType(tab.key)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${type === tab.key ? tab.activeClass : "text-neutral-400 hover:text-white"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {/* Descripción primero */}
            <div className="relative">
              <input
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === "TRANSFER" ? "Descripción (opcional)" : "Descripción (ej: Carrefour, Netflix…)"}
                className={INPUT}
              />
              {loadingSuggestion && (
                <LuLoader size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-500" />
              )}
            </div>

            {/* Sugerencia */}
            {suggestion && !loadingSuggestion && type !== "TRANSFER" && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-950/40 px-3 py-2 ring-1 ring-blue-800/30">
                <LuSparkles size={11} className="flex-shrink-0 text-blue-400" />
                <p className="text-xs text-blue-300">
                  Sugerido: <span className="font-medium text-blue-200">{suggestion.category}</span>
                  {suggestion.confidence === "low" && <span className="ml-1 text-blue-600">(pocas coincidencias)</span>}
                </p>
              </div>
            )}

            {/* Monto + moneda */}
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto"
                className={`${INPUT} flex-1`}
              />
              <div className="flex rounded-lg bg-neutral-800 p-0.5 ring-1 ring-neutral-700">
                {(["ARS", "USD", "EUR"] as DisplayCurrency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setDisplayCurrency(c)}
                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${displayCurrency === c ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuenta origen */}
            <select value={accountRaw} onChange={(e) => setAccountRaw(e.target.value)} className={INPUT}>
              <option value="">{type === "TRANSFER" ? "Desde (cuenta origen)" : "Cuenta"}</option>
              {wallets.length > 0 && (
                <optgroup label="Billeteras">
                  {wallets.map((w) => <option key={w.id} value={`w:${w.id}`}>{w.name} ({w.currency})</option>)}
                </optgroup>
              )}
              {foreignAccounts.length > 0 && (
                <optgroup label="Cuentas foráneas">
                  {foreignAccounts.map((a) => <option key={a.id} value={`f:${a.id}`}>{a.name} ({a.currency})</option>)}
                </optgroup>
              )}
            </select>

            {/* Cuenta destino (solo Transfer) */}
            {type === "TRANSFER" && (
              <select value={toAccountRaw} onChange={(e) => setToAccountRaw(e.target.value)} className={INPUT}>
                <option value="">Hacia (cuenta destino)</option>
                {wallets.length > 0 && (
                  <optgroup label="Billeteras">
                    {wallets.map((w) => <option key={w.id} value={`w:${w.id}`}>{w.name} ({w.currency})</option>)}
                  </optgroup>
                )}
                {foreignAccounts.length > 0 && (
                  <optgroup label="Cuentas foráneas">
                    {foreignAccounts.map((a) => <option key={a.id} value={`f:${a.id}`}>{a.name} ({a.currency})</option>)}
                  </optgroup>
                )}
              </select>
            )}

            {/* Categoría (no para Transfer) */}
            {type !== "TRANSFER" && (
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT}>
                <option value="">Categoría</option>
                {categorias.map((name) => {
                  const cat = categories.find((c) => c.name === name);
                  return (
                    <option key={name} value={name}>
                      {cat?.icon ? `${cat.icon} ${name}` : name}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => submit(false)}
              disabled={saving || !canSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? <LuLoader size={15} className="animate-spin" /> : <LuCheck size={15} />}
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={() => submit(true)}
              disabled={saving || !canSave}
              title="Guardar y registrar otro"
              className="flex items-center gap-1.5 rounded-xl bg-neutral-700 px-3 py-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-600 disabled:opacity-50 transition-colors"
            >
              <LuRepeat size={13} /> Otro
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-neutral-700">⌘⇧G gasto · ⌘⇧I ingreso · ⌘⇧T transfer · ⌘↵ guardar</p>
        </div>
      )}
    </>
  );
}
