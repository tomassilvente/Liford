"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LuTrash2, LuPlus, LuPencil, LuCheck, LuX, LuTarget, LuWallet, LuTrendingUp, LuCalendar, LuZap } from "react-icons/lu";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currency: string;
  notes: string | null;
  targetDate: string | null;
  isAchieved: boolean;
  monthlyDeposit: number | null;
  autoContributionAmount: number | null;
  autoContributionDay: number | null;
  autoContributionFromWallet: string | null;
  accountKey: string | null;
  currentBalance: number;
}

interface Props {
  goals: Goal[];
  accounts: Account[];
}

const INPUT = "rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500";
const EMPTY = {
  name: "", targetAmount: "", currency: "USD", notes: "", targetDate: "",
  accountKey: "", monthlyDeposit: "",
  autoContributionAmount: "", autoContributionDay: "", autoContributionFromWallet: "",
};

function accountKeyToPayload(key: string | null) {
  if (!key) return { walletId: null, foreignAccountId: null };
  const [type, id] = key.split(":");
  return { walletId: type === "wallet" ? id : null, foreignAccountId: type === "foreign" ? id : null };
}

function projectETA(current: number, target: number, totalMonthly: number): { months: number; label: string } | null {
  if (totalMonthly <= 0 || current >= target) return null;
  const months = Math.ceil((target - current) / totalMonthly);
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return {
    months,
    label: d.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
  };
}

interface Account {
  key: string;
  label: string;
  currency: string;
  balance: number;
}

function GoalFormFields({
  f, onChange, accounts,
}: {
  f: typeof EMPTY;
  onChange: (v: typeof EMPTY) => void;
  accounts: Account[];
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input value={f.name} onChange={(e) => onChange({ ...f, name: e.target.value })} placeholder="Nombre de la meta" className={`${INPUT} col-span-2`} autoFocus />
        <input type="number" value={f.targetAmount} onChange={(e) => onChange({ ...f, targetAmount: e.target.value })} placeholder="Objetivo" className={INPUT} />
        <select value={f.currency} onChange={(e) => onChange({ ...f, currency: e.target.value })} className={INPUT}>
          <option value="USD">USD</option>
          <option value="ARS">ARS</option>
        </select>
        <input type="date" value={f.targetDate} onChange={(e) => onChange({ ...f, targetDate: e.target.value })} className={`${INPUT} col-span-2`} />
        <input type="number" value={f.monthlyDeposit} onChange={(e) => onChange({ ...f, monthlyDeposit: e.target.value })} placeholder="Aporte mensual estimado" className={`${INPUT} col-span-2`} />
        <select value={f.accountKey} onChange={(e) => onChange({ ...f, accountKey: e.target.value })} className={`${INPUT} col-span-2`}>
          <option value="">Sin cuenta vinculada</option>
          {accounts.map((a) => <option key={a.key} value={a.key}>{a.label} ({a.currency})</option>)}
        </select>
        <input value={f.notes} onChange={(e) => onChange({ ...f, notes: e.target.value })} placeholder="Notas (opcional)" className={`${INPUT} col-span-2 sm:col-span-4`} />
      </div>
      <div className="rounded-xl bg-neutral-800/50 p-3 space-y-2">
        <p className="text-xs font-medium text-neutral-400 flex items-center gap-1.5"><LuZap size={11} /> Aporte automático (opcional)</p>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={f.autoContributionAmount} onChange={(e) => onChange({ ...f, autoContributionAmount: e.target.value })} placeholder="Monto" className={INPUT} />
          <select value={f.autoContributionDay} onChange={(e) => onChange({ ...f, autoContributionDay: e.target.value })} className={INPUT}>
            <option value="">Día del mes</option>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Día {d}</option>)}
          </select>
          <select value={f.autoContributionFromWallet} onChange={(e) => onChange({ ...f, autoContributionFromWallet: e.target.value })} className={INPUT}>
            <option value="">Cuenta origen</option>
            {accounts.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
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

  function fmtGoal(n: number, cur: string) {
    return new Intl.NumberFormat(cur === "USD" ? "en-US" : "es-AR", {
      style: "currency", currency: cur, maximumFractionDigits: 0,
    }).format(n);
  }

  async function handleAdd() {
    if (!form.name || !form.targetAmount) return;
    setSaving(true);
    await fetch("/api/finanzas/metas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monthlyDeposit: form.monthlyDeposit ? Number(form.monthlyDeposit) : null,
        autoContributionAmount: form.autoContributionAmount ? Number(form.autoContributionAmount) : null,
        autoContributionDay: form.autoContributionDay ? Number(form.autoContributionDay) : null,
        autoContributionFromWallet: form.autoContributionFromWallet || null,
        ...accountKeyToPayload(form.accountKey || null),
      }),
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
      body: JSON.stringify({
        ...editForm,
        targetAmount: editForm.targetAmount,
        monthlyDeposit: editForm.monthlyDeposit ? Number(editForm.monthlyDeposit) : null,
        autoContributionAmount: editForm.autoContributionAmount ? Number(editForm.autoContributionAmount) : null,
        autoContributionDay: editForm.autoContributionDay ? Number(editForm.autoContributionDay) : null,
        autoContributionFromWallet: editForm.autoContributionFromWallet || null,
        ...accountKeyToPayload(editForm.accountKey || null),
      }),
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
      monthlyDeposit: g.monthlyDeposit ? String(g.monthlyDeposit) : "",
      autoContributionAmount: g.autoContributionAmount ? String(g.autoContributionAmount) : "",
      autoContributionDay: g.autoContributionDay ? String(g.autoContributionDay) : "",
      autoContributionFromWallet: g.autoContributionFromWallet ?? "",
    });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nowMs = useMemo(() => Date.now(), []);

  // META DESTACADA: primera activa con auto-contribución, o la de mayor progreso
  const activeGoals = goals.filter((g) => !g.isAchieved);
  const featuredGoal = activeGoals.find((g) => g.autoContributionAmount) ??
    [...activeGoals].sort((a, b) => {
      const pa = a.targetAmount > 0 ? a.currentBalance / a.targetAmount : 0;
      const pb = b.targetAmount > 0 ? b.currentBalance / b.targetAmount : 0;
      return pb - pa;
    })[0] ?? null;

  return (
    <div className="space-y-4">
      {goals.length === 0 && !adding && (
        <p className="text-sm text-neutral-500">No hay metas configuradas.</p>
      )}

      {/* META DESTACADA */}
      {featuredGoal && goals.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-neutral-900 to-neutral-900 p-5 ring-1 ring-blue-900/40 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-3">Meta destacada</p>
          {(() => {
            const g = featuredGoal;
            const pct = g.targetAmount > 0 ? Math.min((g.currentBalance / g.targetAmount) * 100, 100) : 0;
            const falta = Math.max(0, g.targetAmount - g.currentBalance);
            const totalMonthly = (g.monthlyDeposit ?? 0) + (g.autoContributionAmount ?? 0);
            const eta = totalMonthly > 0 ? projectETA(g.currentBalance, g.targetAmount, totalMonthly) : null;
            const daysLeft = g.targetDate ? Math.ceil((new Date(g.targetDate).getTime() - nowMs) / 86400000) : null;
            const isAhead = eta && daysLeft !== null && eta.months * 30 < daysLeft;
            const daysDiff = eta && daysLeft !== null ? Math.abs(daysLeft - eta.months * 30) : null;

            return (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-lg font-bold text-white">{g.name}</p>
                    {g.notes && <p className="text-xs text-neutral-500 mt-0.5">{g.notes}</p>}
                  </div>
                  <button onClick={() => startEdit(g)} className="flex-shrink-0 rounded-lg bg-neutral-700/50 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors">
                    Editar
                  </button>
                </div>

                <div className="flex items-end gap-4 mb-3">
                  <div>
                    <p className="text-2xl font-bold text-white tabular-nums">{fmtGoal(g.currentBalance, g.currency)}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Faltan <span className="text-neutral-300 tabular-nums">{fmtGoal(falta, g.currency)}</span> de {fmtGoal(g.targetAmount, g.currency)}
                    </p>
                  </div>
                  {totalMonthly > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">Por mes</p>
                      <p className="text-sm font-semibold text-white tabular-nums">{fmtGoal(totalMonthly, g.currency)}</p>
                    </div>
                  )}
                </div>

                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-neutral-700/60">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex flex-wrap gap-3 text-xs">
                  {eta && isAhead !== undefined && daysDiff !== null && daysLeft !== null && daysLeft > 0 && (
                    <span className={`rounded-full px-2.5 py-1 font-medium ${isAhead ? "bg-green-900/30 text-green-400 ring-1 ring-green-800/30" : "bg-orange-900/30 text-orange-400 ring-1 ring-orange-800/30"}`}>
                      {isAhead ? `Vas adelantado ${daysDiff}d` : `Llegarías ${daysDiff}d tarde`}
                    </span>
                  )}
                  {eta && (
                    <span className="text-neutral-500 flex items-center gap-1">
                      <LuCalendar size={11} /> Lo lográs en {eta.months === 1 ? "1 mes" : `${eta.months} meses`} ({eta.label})
                    </span>
                  )}
                </div>

                {g.autoContributionAmount && g.autoContributionDay && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-purple-950/30 px-3 py-2 text-xs text-purple-300 ring-1 ring-purple-800/20">
                    <LuZap size={11} className="flex-shrink-0" />
                    Aporte automático · Cada {g.autoContributionDay} del mes · {fmtGoal(g.autoContributionAmount, g.currency)}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {goals.map((g) => {
        const pct = g.targetAmount > 0 ? Math.min((g.currentBalance / g.targetAmount) * 100, 100) : 0;
        const daysLeft = g.targetDate ? Math.ceil((new Date(g.targetDate).getTime() - nowMs) / 86400000) : null;
        const totalMonthly = (g.monthlyDeposit ?? 0) + (g.autoContributionAmount ?? 0);
        const eta = totalMonthly > 0 ? projectETA(g.currentBalance, g.targetAmount, totalMonthly) : null;

        return (
          <div key={g.id} className={`rounded-xl px-5 py-4 ${g.isAchieved ? "bg-neutral-900 opacity-70" : g.id === featuredGoal?.id ? "ring-1 ring-blue-900/30 bg-neutral-800" : "bg-neutral-800"}`}>
            {editingId === g.id ? (
              <div className="space-y-3">
                <GoalFormFields f={editForm} onChange={setEditForm} accounts={accounts} />
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(g.id)} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"><LuCheck size={13} /> Guardar</button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-600"><LuX size={13} /></button>
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
                      {g.autoContributionAmount && !g.isAchieved && (
                        <span className="rounded-full bg-purple-900/30 px-1.5 py-0.5 text-[10px] text-purple-400 ring-1 ring-purple-800/30 flex items-center gap-0.5">
                          <LuZap size={9} /> Auto
                        </span>
                      )}
                    </div>
                    {g.notes && <p className="mt-0.5 text-xs text-neutral-600">{g.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => startEdit(g)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-white"><LuPencil size={13} /></button>
                    <button onClick={() => handleToggleAchieved(g.id, g.isAchieved)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-green-400"><LuCheck size={13} /></button>
                    <button onClick={() => handleDelete(g.id, g.name)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-red-400"><LuTrash2 size={13} /></button>
                  </div>
                </div>

                <GoalBar current={g.currentBalance} target={g.targetAmount} achieved={g.isAchieved} />

                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    {g.accountKey ? (
                      <><LuWallet size={11} /> {fmtGoal(g.currentBalance, g.currency)}</>
                    ) : (
                      <span className="text-neutral-600">Sin cuenta vinculada</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`font-medium tabular-nums ${pct >= 100 ? "text-green-400" : "text-neutral-300"}`}>{pct.toFixed(0)}%</span>
                    <span className="ml-1 text-neutral-600">de {fmtGoal(g.targetAmount, g.currency)}</span>
                    {daysLeft !== null && (
                      <span className={`ml-2 ${daysLeft < 0 ? "text-red-400" : daysLeft < 30 ? "text-yellow-400" : "text-neutral-600"}`}>
                        · {daysLeft < 0 ? `${Math.abs(daysLeft)}d vencida` : `${daysLeft}d restantes`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Proyección ETA */}
                {totalMonthly > 0 && !g.isAchieved && g.currentBalance < g.targetAmount && (
                  <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg bg-neutral-700/30 px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <LuTrendingUp size={11} />
                      <span>
                        {g.autoContributionAmount ? (
                          <>Auto <span className="text-white font-medium">{fmtGoal(g.autoContributionAmount, g.currency)}/mes</span></>
                        ) : (
                          <>Aporte <span className="text-white font-medium">{fmtGoal(totalMonthly, g.currency)}/mes</span></>
                        )}
                      </span>
                    </div>
                    {eta && (
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <LuCalendar size={11} />
                        <span>
                          A este ritmo lo lográs en{" "}
                          <span className="font-medium text-blue-400">
                            {eta.months === 1 ? "1 mes" : `${eta.months} meses`}
                          </span>
                          {" "}({eta.label})
                          {daysLeft !== null && eta.months * 30 > Math.abs(daysLeft) && daysLeft > 0 && (
                            <span className="ml-1 text-orange-400">— llegarías tarde</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="rounded-xl bg-neutral-800 px-5 py-4 space-y-3">
          <p className="text-sm font-medium text-white">Nueva meta</p>
          <GoalFormFields f={form} onChange={setForm} accounts={accounts} />
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
        <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-4 text-sm text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors">
          <LuPlus size={16} /> Nueva meta de ahorro
        </button>
      )}
    </div>
  );
}
