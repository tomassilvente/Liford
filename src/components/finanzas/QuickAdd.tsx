"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LuPlus, LuX, LuCheck, LuLoader, LuRepeat, LuSparkles } from "react-icons/lu";
import { toast } from "sonner";

const FALLBACK_GASTO = ["Alimentación","Transporte","Entretenimiento","Salud","Servicios","Ropa","Educación","Suscripciones","Otro"];
const FALLBACK_INGRESO = ["Sueldo","Freelance","Fotografía","Venta","Inversión","Transferencia recibida","Reembolso","Otro"];

const INPUT = "w-full";

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

  const inputSt: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "var(--paper)", border: "1px solid var(--rule2)",
    padding: "8px 10px", fontFamily: "var(--font-serif)", fontSize: 13,
    color: "var(--ink)", outline: "none",
  };

  const TABS = [
    { key: "EXPENSE"  as TxType, label: "Gasto",    activeBg: "var(--brick)",  activeColor: "var(--paper)" },
    { key: "INCOME"   as TxType, label: "Ingreso",  activeBg: "var(--olive)",  activeColor: "var(--paper)" },
    { key: "TRANSFER" as TxType, label: "Transfer", activeBg: "var(--navy)",   activeColor: "var(--paper)" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ position: "fixed", bottom: 80, left: 20, zIndex: 40, width: 48, height: 48, background: "var(--ink)", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        className="lg:left-auto lg:right-5 lg:bottom-6"
        title="Registrar transacción (⌘⇧G · ⌘⇧I · ⌘⇧T)"
      >
        <LuPlus size={20} style={{ color: "var(--paper)" }} />
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />}

      {open && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "var(--paper2)", border: "1px solid var(--rule2)", borderBottom: "none", padding: 20 }} className="lg:bottom-auto lg:left-auto lg:right-6 lg:top-1/2 lg:-translate-y-1/2 lg:w-[340px] lg:border-b">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              + Asiento · {type === "EXPENSE" ? "gasto" : type === "INCOME" ? "ingreso" : "transferencia"}
            </p>
            <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer" }}>
              <LuX size={15} />
            </button>
          </div>

          {/* Tabs tipo */}
          <div style={{ display: "flex", marginBottom: 14, border: "1px solid var(--rule2)" }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setType(tab.key)}
                style={{ flex: 1, padding: "7px 0", background: type === tab.key ? tab.activeBg : "transparent", color: type === tab.key ? tab.activeColor : "var(--ink3)", border: "none", borderRight: tab.key !== "TRANSFER" ? "1px solid var(--rule2)" : "none", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <input
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === "TRANSFER" ? "Descripción (opcional)" : "Descripción (ej: Carrefour, Netflix…)"}
                style={inputSt}
              />
              {loadingSuggestion && (
                <LuLoader size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }} className="animate-spin" />
              )}
            </div>

            {suggestion && !loadingSuggestion && type !== "TRANSFER" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "var(--paper3)", borderLeft: "3px solid var(--navy)" }}>
                <LuSparkles size={11} style={{ flexShrink: 0, color: "var(--navy)" }} />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--navy)", margin: 0, letterSpacing: "0.08em" }}>
                  Sugerido: <span style={{ fontWeight: 600 }}>{suggestion.category}</span>
                  {suggestion.confidence === "low" && <span style={{ marginLeft: 6, color: "var(--ink3)" }}>(pocas coincidencias)</span>}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto"
                style={{ ...inputSt, flex: 1, minWidth: 0 }}
              />
              <div style={{ display: "flex", border: "1px solid var(--rule2)" }}>
                {(["ARS", "USD", "EUR"] as DisplayCurrency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setDisplayCurrency(c)}
                    style={{ padding: "0 8px", background: displayCurrency === c ? "var(--ink)" : "transparent", color: displayCurrency === c ? "var(--paper)" : "var(--ink3)", border: "none", borderRight: c !== "EUR" ? "1px solid var(--rule2)" : "none", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.06em", cursor: "pointer" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <select value={accountRaw} onChange={(e) => setAccountRaw(e.target.value)} style={inputSt}>
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

            {type === "TRANSFER" && (
              <select value={toAccountRaw} onChange={(e) => setToAccountRaw(e.target.value)} style={inputSt}>
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

            {type !== "TRANSFER" && (
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputSt}>
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

          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button
              onClick={() => submit(false)}
              disabled={saving || !canSave}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--ink)", color: "var(--paper)", border: "none", padding: "10px 0", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", opacity: (saving || !canSave) ? 0.5 : 1 }}
            >
              {saving ? <LuLoader size={14} className="animate-spin" /> : <LuCheck size={14} />}
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={() => submit(true)}
              disabled={saving || !canSave}
              title="Guardar y registrar otro"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--rule2)", color: "var(--ink3)", padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer", opacity: (saving || !canSave) ? 0.5 : 1 }}
            >
              <LuRepeat size={12} /> Otro
            </button>
          </div>
          <p style={{ marginTop: 8, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--rule2)", letterSpacing: "0.06em" }}>⌘⇧G gasto · ⌘⇧I ingreso · ⌘⇧T transfer · ⌘↵ guardar</p>
        </div>
      )}
    </>
  );
}
