"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuTrash2, LuPlus, LuPencil, LuCheck, LuX, LuTarget, LuWallet } from "react-icons/lu";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currency: string;
  notes: string | null;
  targetDate: string | null;
  isAchieved: boolean;
  accountKey: string | null;
  currentBalance: number;
}

interface Account {
  key: string;
  label: string;
  currency: string;
  balance: number;
}

interface Props {
  goals: Goal[];
  accounts: Account[];
}

const INPUT = "rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500";
const EMPTY = { name: "", targetAmount: "", currency: "USD", notes: "", targetDate: "", accountKey: "" };

function accountKeyToPayload(key: string | null) {
  if (!key) return { walletId: null, foreignAccountId: null };
  const [type, id] = key.split(":");
  return { walletId: type === "wallet" ? id : null, foreignAccountId: type === "foreign" ? id : null };
}

function fmt(n: number, cur: string) {
  return new Intl.NumberFormat(cur === "USD" ? "en-US" : "es-AR", {
    style: "currency", currency: cur, maximumFractionDigits: 0,
  }).format(n);
}

function GoalBar({ current, target, achieved }: { current: number; target: number; achieved: boolean }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-700">
      <div
        className={`h-full rounded-full transition-all ${achieved ? "bg-blue-400" : pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-blue-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function GoalsManager({ goals, accounts }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!form.name || !form.targetAmount) return;
    setSaving(true);
    await fetch("/api/finanzas/metas", {
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
    if (!editForm.name || !editForm.targetAmount) return;
    setSaving(true);
    await fetch(`/api/finanzas/metas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, targetAmount: editForm.targetAmount, ...accountKeyToPayload(editForm.accountKey || null) }),
    });
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleToggleAchieved(id: string, current: boolean) {
    await fetch(`/api/finanzas/metas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAchieved: !current }),
    });
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar la meta "${name}"?`)) return;
    await fetch(`/api/finanzas/metas/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function startEdit(g: Goal) {
    setEditingId(g.id);
    setEditForm({
      name: g.name,
      targetAmount: String(g.targetAmount),
      currency: g.currency,
      notes: g.notes ?? "",
      targetDate: g.targetDate ? g.targetDate.slice(0, 10) : "",
      accountKey: g.accountKey ?? "",
    });
  }

  return (
    <div className="space-y-4">
      {goals.length === 0 && !adding && (
        <p className="text-sm text-neutral-500">No hay metas configuradas.</p>
      )}

      {goals.map((g) => {
        const pct = g.targetAmount > 0 ? Math.min((g.currentBalance / g.targetAmount) * 100, 100) : 0;
        const daysLeft = g.targetDate
          ? Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / 86400000)
          : null;

        return (
          <div key={g.id} className={`rounded-xl px-5 py-4 ${g.isAchieved ? "bg-neutral-900 opacity-70" : "bg-neutral-800"}`}>
            {editingId === g.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nombre de la meta" className={`${INPUT} col-span-2`} autoFocus />
                  <input type="number" value={editForm.targetAmount} onChange={(e) => setEditForm({ ...editForm, targetAmount: e.target.value })} placeholder="Objetivo" className={INPUT} />
                  <select value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} className={INPUT}>
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                  <input type="date" value={editForm.targetDate} onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })} className={`${INPUT} col-span-2`} />
                  <select value={editForm.accountKey} onChange={(e) => setEditForm({ ...editForm, accountKey: e.target.value })} className={`${INPUT} col-span-2`}>
                    <option value="">Sin cuenta vinculada</option>
                    {accounts.map((a) => <option key={a.key} value={a.key}>{a.label} ({a.currency})</option>)}
                  </select>
                  <input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notas (opcional)" className={`${INPUT} col-span-2 sm:col-span-4`} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(g.id)} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                    <LuCheck size={13} /> Guardar
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-600">
                    <LuX size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <LuTarget size={14} className={g.isAchieved ? "text-blue-400" : "text-neutral-400"} />
                      <p className={`text-sm font-medium ${g.isAchieved ? "text-neutral-400 line-through" : "text-white"}`}>{g.name}</p>
                      {g.isAchieved && <span className="rounded-full bg-blue-900 px-2 py-0.5 text-xs text-blue-400">Lograda</span>}
                    </div>
                    {g.notes && <p className="mt-0.5 text-xs text-neutral-600">{g.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => startEdit(g)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-white">
                      <LuPencil size={13} />
                    </button>
                    <button onClick={() => handleToggleAchieved(g.id, g.isAchieved)} title={g.isAchieved ? "Marcar pendiente" : "Marcar lograda"} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-green-400">
                      <LuCheck size={13} />
                    </button>
                    <button onClick={() => handleDelete(g.id, g.name)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-red-400">
                      <LuTrash2 size={13} />
                    </button>
                  </div>
                </div>

                <GoalBar current={g.currentBalance} target={g.targetAmount} achieved={g.isAchieved} />

                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    {g.accountKey ? (
                      <><LuWallet size={11} /> {fmt(g.currentBalance, g.currency)}</>
                    ) : (
                      <span className="text-neutral-600">Sin cuenta vinculada</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${pct >= 100 ? "text-green-400" : "text-neutral-300"}`}>{pct.toFixed(0)}%</span>
                    <span className="ml-1 text-neutral-600">de {fmt(g.targetAmount, g.currency)}</span>
                    {daysLeft !== null && (
                      <span className={`ml-2 ${daysLeft < 0 ? "text-red-400" : daysLeft < 30 ? "text-yellow-400" : "text-neutral-600"}`}>
                        · {daysLeft < 0 ? `${Math.abs(daysLeft)}d vencida` : `${daysLeft}d restantes`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="rounded-xl bg-neutral-800 px-5 py-4 space-y-3">
          <p className="text-sm font-medium text-white">Nueva meta</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre (ej: Viaje a Europa)" className={`${INPUT} col-span-2`} autoFocus />
            <input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="Objetivo" className={INPUT} />
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={INPUT}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
            <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className={`${INPUT} col-span-2`} />
            <select value={form.accountKey} onChange={(e) => setForm({ ...form, accountKey: e.target.value })} className={`${INPUT} col-span-2`}>
              <option value="">Sin cuenta vinculada</option>
              {accounts.map((a) => <option key={a.key} value={a.key}>{a.label} ({a.currency})</option>)}
            </select>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas (opcional)" className={`${INPUT} col-span-2 sm:col-span-4`} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !form.name || !form.targetAmount} className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Guardando..." : "Crear meta"}
            </button>
            <button onClick={() => { setAdding(false); setForm(EMPTY); }} className="rounded-lg bg-neutral-700 px-4 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-600">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-4 text-sm text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white">
          <LuPlus size={16} /> Nueva meta de ahorro
        </button>
      )}
    </div>
  );
}
