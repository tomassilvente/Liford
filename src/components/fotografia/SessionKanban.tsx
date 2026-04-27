"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { LuTriangleAlert, LuImages, LuDollarSign } from "react-icons/lu";

export interface KanbanSession {
  id: string;
  clientName: string;
  clientId: string;
  type: string;
  eventName: string | null;
  date: string;
  price: number;
  currency: string;
  status: string;
  driveUrl: string | null;
  photosDelivered: number | null;
  daysInStatus: number;
}

const COLUMNS = [
  { key: "PENDING",   label: "Pendiente",  color: "border-yellow-800/40 bg-yellow-950/10" },
  { key: "CONFIRMED", label: "Confirmada", color: "border-blue-800/40 bg-blue-950/10" },
  { key: "SHOT",      label: "Disparada",  color: "border-purple-800/40 bg-purple-950/10" },
  { key: "DELIVERED", label: "Entregada",  color: "border-cyan-800/40 bg-cyan-950/10" },
  { key: "PAID",      label: "Pagada",     color: "border-green-800/40 bg-green-950/10" },
  { key: "COMPLETED", label: "Completada", color: "border-neutral-700/40 bg-neutral-800/10" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "text-yellow-400 bg-yellow-400/10",
  CONFIRMED: "text-blue-400 bg-blue-400/10",
  SHOT:      "text-purple-400 bg-purple-400/10",
  DELIVERED: "text-cyan-400 bg-cyan-400/10",
  PAID:      "text-green-400 bg-green-400/10",
  COMPLETED: "text-neutral-400 bg-neutral-400/10",
};

const TZ = "America/Argentina/Buenos_Aires";

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ, day: "2-digit", month: "short",
  }).format(new Date(iso));
}

function fmtPrice(n: number, currency: string) {
  return currency === "ARS"
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

function SessionCard({ session }: { session: KanbanSession }) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);

  const NEXT_STATUS: Record<string, string> = {
    PENDING: "CONFIRMED", CONFIRMED: "SHOT", SHOT: "DELIVERED",
    DELIVERED: "PAID", PAID: "COMPLETED",
  };
  const nextStatus = NEXT_STATUS[session.status];

  const needsDelivery = session.status === "SHOT" && session.daysInStatus > 7;
  const needsPayment  = session.status === "DELIVERED";

  async function advance() {
    if (!nextStatus) return;
    setMoving(true);
    const res = await fetch(`/api/fotografia/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setMoving(false);
    if (res.ok) { router.refresh(); }
    else toast.error("No se pudo cambiar el estado");
  }

  return (
    <div className="rounded-xl bg-neutral-800 p-3 ring-1 ring-neutral-700 hover:ring-neutral-600 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/fotografia/sesiones/${session.id}`}
          className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate"
        >
          {session.clientName}
        </Link>
        <div className="flex gap-1 flex-shrink-0">
          {session.driveUrl && (
            <a href={session.driveUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-cyan-400 transition-colors" title="Ver fotos">
              <LuImages size={13} />
            </a>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-500 mb-2">
        {session.type === "SPORT" ? "Deporte" : session.type === "EVENT" ? "Evento" : "Otro"}
        {session.eventName ? ` — ${session.eventName}` : ""}
        {" · "}{fmtDate(session.date)}
      </p>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-semibold text-neutral-300">
          {fmtPrice(session.price, session.currency)}
        </span>
        {nextStatus && (
          <button
            onClick={advance}
            disabled={moving}
            className="rounded-lg bg-neutral-700 px-2 py-1 text-[10px] font-medium text-neutral-300 hover:bg-neutral-600 hover:text-white transition-colors disabled:opacity-50"
          >
            {moving ? "..." : `→ ${COLUMNS.find((c) => c.key === nextStatus)?.label}`}
          </button>
        )}
      </div>

      {/* Alertas de acción */}
      {needsDelivery && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-orange-950/30 px-2 py-1.5 text-xs text-orange-400 ring-1 ring-orange-800/30">
          <LuTriangleAlert size={11} />
          Falta entregar fotos ({session.daysInStatus}d)
        </div>
      )}
      {needsPayment && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-green-950/30 px-2 py-1.5 text-xs text-green-400 ring-1 ring-green-800/30">
          <LuDollarSign size={11} />
          Falta cobrar
        </div>
      )}
    </div>
  );
}

interface Props {
  sessions: KanbanSession[];
}

export default function SessionKanban({ sessions }: Props) {
  const grouped = Object.fromEntries(
    COLUMNS.map((col) => [col.key, sessions.filter((s) => s.status === col.key)])
  );

  const totalByStatus = Object.fromEntries(
    COLUMNS.map((col) => [col.key, grouped[col.key].length])
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map((col) => {
          const cards = grouped[col.key];
          return (
            <div key={col.key} className={`flex w-64 flex-col rounded-2xl border p-3 ${col.color}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {col.label}
                </p>
                {totalByStatus[col.key] > 0 && (
                  <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
                    {totalByStatus[col.key]}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 min-h-[80px]">
                {cards.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center py-6">
                    <p className="text-xs text-neutral-700">Sin sesiones</p>
                  </div>
                ) : (
                  cards.map((s) => <SessionCard key={s.id} session={s} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
