"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { LuTriangleAlert, LuImages, LuDollarSign } from "react-icons/lu";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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

function SessionCard({ session, isDragging = false }: { session: KanbanSession; isDragging?: boolean }) {
  const needsDelivery = session.status === "SHOT" && session.daysInStatus > 7;
  const needsPayment  = session.status === "DELIVERED";

  return (
    <div className={`rounded-xl bg-neutral-800 p-3 ring-1 ring-neutral-700 transition-all select-none ${isDragging ? "opacity-50 shadow-xl scale-105" : "hover:ring-neutral-600 cursor-grab active:cursor-grabbing"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/fotografia/sesiones/${session.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate"
        >
          {session.clientName}
        </Link>
        {session.driveUrl && (
          <a
            href={session.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-neutral-500 hover:text-cyan-400 transition-colors flex-shrink-0"
            title="Ver fotos"
          >
            <LuImages size={13} />
          </a>
        )}
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
      </div>

      {needsDelivery && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-orange-950/30 px-2 py-1.5 text-xs text-orange-400 ring-1 ring-orange-800/30">
          <LuTriangleAlert size={11} />
          Falta entregar ({session.daysInStatus}d)
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

function DraggableCard({ session }: { session: KanbanSession }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.id,
    data: { session },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
    >
      <SessionCard session={session} isDragging={isDragging} />
    </div>
  );
}

function DroppableColumn({
  column,
  sessions,
  isOver,
}: {
  column: typeof COLUMNS[number];
  sessions: KanbanSession[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 flex-col rounded-2xl border p-3 transition-colors ${column.color} ${isOver ? "ring-2 ring-blue-500/40" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {column.label}
        </p>
        {sessions.length > 0 && (
          <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
            {sessions.length}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 min-h-[80px]">
        {sessions.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-6">
            <p className="text-xs text-neutral-700">Sin sesiones</p>
          </div>
        ) : (
          sessions.map((s) => <DraggableCard key={s.id} session={s} />)
        )}
      </div>
    </div>
  );
}

interface Props {
  sessions: KanbanSession[];
}

export default function SessionKanban({ sessions: initialSessions }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [activeSession, setActiveSession] = useState<KanbanSession | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const grouped = Object.fromEntries(
    COLUMNS.map((col) => [col.key, sessions.filter((s) => s.status === col.key)])
  );

  function handleDragStart({ active }: DragStartEvent) {
    const s = sessions.find((s) => s.id === active.id);
    if (s) setActiveSession(s);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveSession(null);
    setOverColumn(null);

    if (!over) return;
    const newStatus = over.id as string;
    const session = sessions.find((s) => s.id === active.id);
    if (!session || session.status === newStatus) return;

    // Optimistic update
    setSessions((prev) =>
      prev.map((s) => s.id === session.id ? { ...s, status: newStatus } : s)
    );

    const res = await fetch(`/api/fotografia/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      toast.error("No se pudo cambiar el estado");
      setSessions(initialSessions); // revert
    } else {
      router.refresh();
    }
  }

  function handleDragOver({ over }: { over: { id: string } | null }) {
    setOverColumn(over?.id ?? null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver as () => void}
    >
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.key}
              column={col}
              sessions={grouped[col.key]}
              isOver={overColumn === col.key}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeSession && <SessionCard session={activeSession} isDragging={false} />}
      </DragOverlay>
    </DndContext>
  );
}
