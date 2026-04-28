"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LuRepeat, LuX, LuSkipForward, LuPencil, LuPause, LuPlay } from "react-icons/lu";
import { toast } from "sonner";

interface Props {
  ruleId: string;
  onClose: () => void;
}

interface Rule {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  dayOfMonth: number;
  isActive: boolean;
  transactionType: string;
}

export default function RecurrentRuleModal({ ruleId, onClose }: Props) {
  const router = useRouter();
  const [rule, setRule] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  // Cargar la regla al montar
  useEffect(() => {
    fetch(`/api/finanzas/recurrentes/${ruleId}`)
      .then((r) => r.json())
      .then((data) => { setRule(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [ruleId]);

  async function togglePause() {
    if (!rule) return;
    setWorking(true);
    const res = await fetch(`/api/finanzas/recurrentes/${ruleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    setWorking(false);
    if (res.ok) {
      toast.success(rule.isActive ? "Recurrente pausado" : "Recurrente reactivado");
      router.refresh();
      onClose();
    } else {
      toast.error("No se pudo actualizar");
    }
  }

  async function skipNext() {
    if (!rule) return;
    setWorking(true);
    // "Saltar próxima" = actualizar lastApplied al mes actual para que no se aplique este mes
    const now = new Date();
    const res = await fetch(`/api/finanzas/recurrentes/${ruleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastApplied: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() }),
    });
    setWorking(false);
    if (res.ok) {
      toast.success("Próxima ocurrencia salteada");
      router.refresh();
      onClose();
    } else {
      toast.error("No se pudo saltear");
    }
  }

  const fmtAmount = (n: number, currency: string) =>
    currency === "USD"
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
      : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-neutral-900 p-5 shadow-2xl ring-1 ring-neutral-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <LuRepeat size={14} className="text-neutral-400" />
            Regla recurrente
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-500 hover:text-white">
            <LuX size={16} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500 py-4 text-center">Cargando...</p>
        ) : !rule ? (
          <p className="text-sm text-neutral-500 py-4 text-center">No se pudo cargar la regla.</p>
        ) : (
          <>
            <div className="mb-4 rounded-xl bg-neutral-800 p-4 space-y-1.5">
              <p className="text-base font-medium text-white">{rule.description}</p>
              <p className="text-sm text-neutral-400">{fmtAmount(rule.amount, rule.currency)} · día {rule.dayOfMonth} de cada mes</p>
              <p className="text-xs text-neutral-600">{rule.category} · {rule.transactionType === "EXPENSE" ? "Gasto" : "Ingreso"}</p>
              {!rule.isActive && (
                <span className="inline-block rounded-full bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-500 ring-1 ring-yellow-800/30">
                  Pausado
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={skipNext}
                disabled={working || !rule.isActive}
                className="flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors disabled:opacity-40"
              >
                <LuSkipForward size={14} /> Saltar próxima ocurrencia
              </button>

              <button
                onClick={togglePause}
                disabled={working}
                className="flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors disabled:opacity-40"
              >
                {rule.isActive ? <><LuPause size={14} /> Pausar regla</> : <><LuPlay size={14} /> Reactivar regla</>}
              </button>

              <Link
                href="/finanzas/recurrentes"
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                <LuPencil size={14} /> Editar regla completa
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
