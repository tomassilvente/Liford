"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuTrash2, LuPlus, LuPencil, LuCheck, LuX, LuPause, LuPlay, LuWallet, LuTrendingDown, LuTrendingUp } from "react-icons/lu";

interface RecurringExpense {
  id: string;
  transactionType: "EXPENSE" | "INCOME";
  description: string;
  amount: number;
  currency: string;
  category: string;
  dayOfMonth: number;
  isActive: boolean;
  lastApplied: string | null;
  accountKey: string | null;
}

interface Account {
  key: string;
  label: string;
  currency: string;
}

interface FormState {
  transactionType: "EXPENSE" | "INCOME";
  description: string;
  amount: string;
  currency: string;
  category: string;
  dayOfMonth: string;
  accountKey: string;
}

interface Props {
  items: RecurringExpense[];
  categoriasGasto: string[];
  categoriasIngreso: string[];
  accounts: Account[];
  accountMap: Record<string, string>;
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-AR", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(amount);
}

function accountKeyToPayload(key: string | null) {
  if (!key) return { walletId: null, foreignAccountId: null };
  const [type, id] = key.split(":");
  return {
    walletId: type === "wallet" ? id : null,
    foreignAccountId: type === "foreign" ? id : null,
  };
}

const EMPTY: FormState = {
  transactionType: "EXPENSE",
  description: "",
  amount: "",
  currency: "ARS",
  category: "",
  dayOfMonth: "1",
  accountKey: "",
};

const INPUT = "w-full rounded-lg bg-neutral-900 px-3 py-2.5 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500";
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function TypeToggle({ value, onChange }: { value: "EXPENSE" | "INCOME"; onChange: (v: "EXPENSE" | "INCOME") => void }) {
  return (
    <div className="flex rounded-lg bg-neutral-900 ring-1 ring-neutral-700 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange("EXPENSE")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
          value === "EXPENSE" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
        }`}
      >
        <LuTrendingDown size={13} /> Gasto
      </button>
      <button
        type="button"
        onClick={() => onChange("INCOME")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
          value === "INCOME" ? "bg-green-600 text-white" : "text-neutral-400 hover:text-white"
        }`}
      >
        <LuTrendingUp size={13} /> Ingreso
      </button>
    </div>
  );
}

function RecurringFormFields({
  form,
  setForm,
  autoFocusDesc,
  categoriasGasto,
  categoriasIngreso,
  accounts,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  autoFocusDesc?: boolean;
  categoriasGasto: string[];
  categoriasIngreso: string[];
  accounts: Account[];
}) {
  const cats = form.transactionType === "EXPENSE" ? categoriasGasto : categoriasIngreso;
  return (
    <div className="space-y-2.5">
      <TypeToggle
        value={form.transactionType}
        onChange={(v) => setForm({ ...form, transactionType: v, category: "" })}
      />
      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder={form.transactionType === "EXPENSE" ? "Descripción (ej: Netflix)" : "Descripción (ej: Sueldo)"}
        className={INPUT}
        autoFocus={autoFocusDesc}
      />
      <div className="flex gap-2">
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Monto"
          className={`${INPUT} flex-1 min-w-0`}
        />
        <select
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
          className="w-24 shrink-0 rounded-lg bg-neutral-900 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={INPUT}>
          <option value="">Categoría</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={form.dayOfMonth} onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })} className={INPUT}>
          {DAYS.map((d) => <option key={d} value={d}>Día {d}</option>)}
        </select>
      </div>
      <select value={form.accountKey} onChange={(e) => setForm({ ...form, accountKey: e.target.value })} className={INPUT}>
        <option value="">Sin acreditar/descontar de cuenta</option>
        {accounts.map((a) => <option key={a.key} value={a.key}>{a.label} ({a.currency})</option>)}
      </select>
    </div>
  );
}

export default function RecurringManager({ items, categoriasGasto, categoriasIngreso, accounts, accountMap }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const expenses = items.filter((i) => i.transactionType === "EXPENSE");
  const incomes = items.filter((i) => i.transactionType === "INCOME");

  async function handleAdd() {
    if (!form.description || !form.amount || !form.category) return;
    setSaving(true);
    await fetch("/api/finanzas/recurrentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...accountKeyToPayload(form.accountKey || null) }),
    });
    setSaving(false);
    setAdding(false);
    setForm(EMPTY);
    router.refresh();
  }

  async function handleEdit(id: string) {
    if (!editForm.description || !editForm.amount || !editForm.category) return;
    setSaving(true);
    await fetch(`/api/finanzas/recurrentes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, ...accountKeyToPayload(editForm.accountKey || null) }),
    });
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleToggle(id: string, isActive: boolean) {
    await fetch(`/api/finanzas/recurrentes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  async function handleDelete(id: string, description: string) {
    if (!confirm(`¿Eliminar "${description}"?`)) return;
    await fetch(`/api/finanzas/recurrentes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function startEdit(item: RecurringExpense) {
    setEditingId(item.id);
    setEditForm({
      transactionType: item.transactionType,
      description: item.description,
      amount: String(item.amount),
      currency: item.currency,
      category: item.category,
      dayOfMonth: String(item.dayOfMonth),
      accountKey: item.accountKey ?? "",
    });
  }

  function renderItem(item: RecurringExpense) {
    const isEditing = editingId === item.id;
    const accountLabel = item.accountKey ? accountMap[item.accountKey] : null;
    const isExpense = item.transactionType === "EXPENSE";

    return (
      <div
        key={item.id}
        className={`rounded-xl px-5 py-4 transition-opacity ${item.isActive ? "bg-neutral-800" : "bg-neutral-900 opacity-60"}`}
      >
        {isEditing ? (
          <div className="space-y-3">
            <RecurringFormFields
              form={editForm}
              setForm={setEditForm}
              autoFocusDesc
              categoriasGasto={categoriasGasto}
              categoriasIngreso={categoriasIngreso}
              accounts={accounts}
            />
            <div className="flex gap-2">
              <button onClick={() => handleEdit(item.id)} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                <LuCheck size={13} /> Guardar
              </button>
              <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-600">
                <LuX size={13} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">{item.description}</p>
                {!item.isActive && (
                  <span className="shrink-0 rounded-full bg-neutral-700 px-2 py-0.5 text-xs text-neutral-400">Pausado</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                {item.category} · día {item.dayOfMonth} de cada mes
                {item.lastApplied && (
                  <> · último {isExpense ? "cobro" : "acredito"} {new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(item.lastApplied))}</>
                )}
              </p>
              {accountLabel && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-600">
                  <LuWallet size={11} /> {accountLabel}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className={`text-sm font-semibold ${isExpense ? "text-red-400" : "text-green-400"}`}>
                {isExpense ? "-" : "+"}{fmt(item.amount, item.currency)}
              </span>
              <button onClick={() => startEdit(item)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-white">
                <LuPencil size={13} />
              </button>
              <button onClick={() => handleToggle(item.id, item.isActive)} title={item.isActive ? "Pausar" : "Activar"} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-white">
                {item.isActive ? <LuPause size={13} /> : <LuPlay size={13} />}
              </button>
              <button onClick={() => handleDelete(item.id, item.description)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-red-400">
                <LuTrash2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gastos */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-400">
          <LuTrendingDown size={14} className="text-red-400" /> Gastos recurrentes
        </h2>
        {expenses.length === 0 && (
          <p className="text-sm text-neutral-600">Sin gastos recurrentes.</p>
        )}
        {expenses.map(renderItem)}
      </div>

      {/* Ingresos */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-400">
          <LuTrendingUp size={14} className="text-green-400" /> Ingresos recurrentes
        </h2>
        {incomes.length === 0 && (
          <p className="text-sm text-neutral-600">Sin ingresos recurrentes.</p>
        )}
        {incomes.map(renderItem)}
      </div>

      {/* Agregar */}
      {adding ? (
        <div className="rounded-xl bg-neutral-800 px-5 py-4 space-y-3">
          <p className="text-sm font-medium text-white">Nuevo recurrente</p>
          <RecurringFormFields
            form={form}
            setForm={setForm}
            autoFocusDesc
            categoriasGasto={categoriasGasto}
            categoriasIngreso={categoriasIngreso}
            accounts={accounts}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !form.description || !form.amount || !form.category}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Agregar"}
            </button>
            <button
              onClick={() => { setAdding(false); setForm(EMPTY); }}
              className="rounded-lg bg-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-4 text-sm text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
        >
          <LuPlus size={16} /> Agregar recurrente
        </button>
      )}
    </div>
  );
}
