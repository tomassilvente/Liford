"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuLoader, LuCheck, LuRefreshCw, LuCircleAlert, LuCopy, LuArrowLeftRight, LuPencil } from "react-icons/lu";
import { toast } from "sonner";

interface MPTransaction {
  date: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  currency: "ARS" | "USD";
  category: string;
  description: string;
  source: "PERSONAL";
  mpId: string;
  possibleDuplicate: boolean;
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const CATEGORIAS: Record<"EXPENSE" | "INCOME", string[]> = {
  EXPENSE: ["Alimentación", "Transporte", "Entretenimiento", "Salud", "Servicios", "Ropa", "Educación", "Suscripciones", "Otro"],
  INCOME: ["Sueldo", "Freelance", "Fotografía", "Venta", "Inversión", "Transferencia recibida", "Reembolso", "Otro"],
};

interface Wallet { id: string; name: string; currency: string; }

export default function MercadoPagoSync({ wallets }: { wallets: Wallet[] }) {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<MPTransaction[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [done, setDone] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  async function sync() {
    setLoading(true);
    setError(null);
    setTransactions(null);
    setDone(null);
    setEditing(null);

    try {
      const res = await fetch(`/api/finanzas/mercadopago?days=${days}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al sincronizar");

      setTransactions(data.transactions);
      setSelected(new Set(
        data.transactions
          .map((_: unknown, i: number) => i)
          .filter((i: number) => !data.transactions[i].possibleDuplicate)
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function flipType(i: number) {
    if (!transactions) return;
    const updated = [...transactions];
    updated[i] = {
      ...updated[i],
      type: updated[i].type === "EXPENSE" ? "INCOME" : "EXPENSE",
      category: updated[i].type === "EXPENSE" ? "Otro" : "Otro",
    };
    setTransactions(updated);
  }

  function updateField(i: number, field: keyof MPTransaction, value: string) {
    if (!transactions) return;
    const updated = [...transactions];
    updated[i] = { ...updated[i], [field]: value };
    setTransactions(updated);
  }

  async function confirm() {
    if (!transactions) return;
    const toImport = transactions
      .filter((_, i) => selected.has(i))
      .map(({ mpId: _, possibleDuplicate: __, ...t }) => t);

    setSaving(true);
    try {
      const res = await fetch("/api/finanzas/mercadopago/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: toImport, walletId: walletId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al importar");
      setDone(data.imported);
      setTransactions(null);

      const walletMsg = data.walletName
        ? ` · Saldo de ${data.walletName} actualizado (${data.netChange >= 0 ? "+" : ""}${new Intl.NumberFormat("es-AR").format(data.netChange)})`
        : "";
      toast.success(`${data.imported} movimientos importados${walletMsg}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setSaving(false);
    }
  }

  if (done !== null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-green-800/40 bg-green-900/10 py-10 text-center">
        <LuCheck size={28} className="text-green-400" />
        <p className="font-medium text-white">{done} movimientos importados</p>
        <button onClick={() => { setDone(null); }} className="mt-1 text-sm text-neutral-500 hover:text-neutral-300">
          Sincronizar de nuevo
        </button>
      </div>
    );
  }

  if (transactions) {
    const dupeCount = transactions.filter((t) => t.possibleDuplicate).length;

    return (
      <div className="space-y-3">
        {/* Instrucciones */}
        <div className="rounded-xl border border-neutral-700/60 bg-neutral-900/40 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Cómo usar esta función</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-bold text-neutral-300">1</span>
              <p className="text-xs text-neutral-400">
                <span className="font-medium text-neutral-200">Revisá la dirección.</span>{" "}
                MP a veces no distingue bien si algo es gasto o ingreso. Tocá el badge <span className="rounded bg-red-400/15 px-1 text-red-400 font-semibold">GASTO</span> o <span className="rounded bg-green-400/15 px-1 text-green-400 font-semibold">INGRESO</span> para invertirlo.
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-bold text-neutral-300">2</span>
              <p className="text-xs text-neutral-400">
                <span className="font-medium text-neutral-200">Editá descripción y categoría.</span>{" "}
                Tocá ✏️ en cada fila para ponerle un nombre útil y asignarle la categoría correcta. MP no expone el nombre del contacto en su API.
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-bold text-neutral-300">3</span>
              <p className="text-xs text-neutral-400">
                <span className="font-medium text-neutral-200">Confirmá lo que querés importar.</span>{" "}
                Los posibles duplicados quedan deseleccionados. Destildá los que ya tenés cargados y presioná Importar.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-neutral-600 border-t border-neutral-700/60 pt-2">
            ⚠️ Esta sincronización agrega los movimientos al historial pero no actualiza automáticamente el saldo de tus billeteras. Ajustá el saldo manualmente en la sección Billeteras si es necesario.
          </p>
        </div>

        {/* Aviso duplicados */}
        {dupeCount > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-800/40 bg-yellow-900/10 px-4 py-3">
            <LuCopy size={14} className="mt-0.5 flex-shrink-0 text-yellow-400" />
            <p className="text-sm text-yellow-300">
              <span className="font-medium">{dupeCount} {dupeCount === 1 ? "movimiento coincide" : "movimientos coinciden"} con transacciones ya registradas</span> — deseleccionados por defecto.
            </p>
          </div>
        )}

        {/* Controles */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if (!transactions) return;
              if (selected.size === transactions.length) setSelected(new Set());
              else setSelected(new Set(transactions.map((_, i) => i)));
            }} className="text-xs text-neutral-500 hover:text-neutral-300">
              {selected.size === transactions.length ? "Deseleccionar todo" : "Seleccionar todo"}
            </button>
            <span className="text-neutral-700">·</span>
            <span className="text-xs text-neutral-500">{selected.size} de {transactions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {walletId && wallets.find((w) => w.id === walletId) && (
              <span className="text-xs text-neutral-500">
                Saldo de <strong className="text-neutral-300">{wallets.find((w) => w.id === walletId)?.name}</strong> se actualizará
              </span>
            )}
            <button onClick={() => setTransactions(null)} className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-600">
              Cancelar
            </button>
            <button
              onClick={confirm}
              disabled={saving || selected.size === 0}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? <LuLoader size={12} className="animate-spin" /> : <LuCheck size={12} />}
              {saving ? "Importando..." : `Importar ${selected.size} movimientos`}
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="rounded-xl bg-neutral-800 overflow-hidden divide-y divide-neutral-700">
          {transactions.map((t, i) => (
            <div key={t.mpId} className={t.possibleDuplicate ? "opacity-50" : ""}>
              {/* Fila principal */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => {
                    const next = new Set(selected);
                    next.has(i) ? next.delete(i) : next.add(i);
                    setSelected(next);
                  }}
                  className="h-4 w-4 flex-shrink-0 accent-blue-500"
                />

                {/* Toggle gasto/ingreso */}
                <button
                  onClick={() => flipType(i)}
                  title="Invertir gasto/ingreso"
                  className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                    t.type === "EXPENSE"
                      ? "bg-red-400/10 text-red-400 hover:bg-red-400/20"
                      : "bg-green-400/10 text-green-400 hover:bg-green-400/20"
                  }`}
                >
                  {t.type === "EXPENSE" ? "GASTO" : "INGRESO"}
                  <LuArrowLeftRight size={9} className="inline ml-1" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm text-white">{t.description}</p>
                    {t.possibleDuplicate && (
                      <span className="flex-shrink-0 rounded-full bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                        duplicado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">{t.category} · {t.date}</p>
                </div>

                <span className={`flex-shrink-0 text-sm font-semibold ${t.type === "EXPENSE" ? "text-red-400" : "text-green-400"}`}>
                  {t.type === "EXPENSE" ? "-" : "+"}{fmt(t.amount, t.currency)}
                </span>

                {/* Editar */}
                <button
                  onClick={() => setEditing(editing === i ? null : i)}
                  className="flex-shrink-0 text-neutral-600 hover:text-neutral-300 transition-colors"
                  title="Editar descripción y categoría"
                >
                  <LuPencil size={13} />
                </button>
              </div>

              {/* Panel de edición */}
              {editing === i && (
                <div className="grid grid-cols-2 gap-2 border-t border-neutral-700 bg-neutral-900/50 px-4 py-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-neutral-500">Descripción</label>
                    <input
                      value={t.description}
                      onChange={(e) => updateField(i, "description", e.target.value)}
                      className="w-full rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-neutral-500">Categoría</label>
                    <select
                      value={t.category}
                      onChange={(e) => updateField(i, "category", e.target.value)}
                      className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
                    >
                      {CATEGORIAS[t.type].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 w-full"
                    >
                      Listo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Descripción de la función */}
      <div className="rounded-xl border border-neutral-700/60 bg-neutral-900/40 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Qué hace esta función</p>
        <p className="text-sm text-neutral-400">
          Trae tus movimientos de Mercado Pago directamente desde tu cuenta y te muestra una <span className="text-neutral-200">preview para revisar</span> antes de importarlos. Nada se guarda hasta que confirmás.
        </p>
        <ul className="space-y-1 text-xs text-neutral-500">
          <li className="flex items-start gap-1.5"><span className="text-neutral-600 mt-0.5">→</span> Detecta automáticamente si cada movimiento es gasto o ingreso.</li>
          <li className="flex items-start gap-1.5"><span className="text-neutral-600 mt-0.5">→</span> Compara contra lo que ya tenés registrado y marca los posibles duplicados.</li>
          <li className="flex items-start gap-1.5"><span className="text-neutral-600 mt-0.5">→</span> Podés editar descripción, categoría y dirección antes de confirmar.</li>
          <li className="flex items-start gap-1.5"><span className="text-yellow-700 mt-0.5">→</span> <span>No actualiza el saldo de tus billeteras automáticamente — hacelo manualmente en Billeteras si es necesario.</span></li>
        </ul>
      </div>

      <div className="rounded-xl bg-neutral-800 p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm text-neutral-400">Período</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={15}>Últimos 15 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={60}>Últimos 60 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-neutral-400">Actualizar saldo de</label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          >
            <option value="">Sin actualizar saldo</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={sync}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? <LuLoader size={15} className="animate-spin" /> : <LuRefreshCw size={15} />}
            {loading ? "Conectando..." : "Sincronizar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-800/40 bg-red-900/10 p-3">
          <LuCircleAlert size={15} className="mt-0.5 flex-shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-400">No se pudo conectar con Mercado Pago</p>
            <p className="mt-1 text-xs text-neutral-500">{error}</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
