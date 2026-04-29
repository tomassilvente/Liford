"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { LuTriangleAlert, LuImages } from "react-icons/lu";
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
  { key: "PENDING", label: "Pendiente", sub: "a confirmar",     stampColor: "var(--rust)" },
  { key: "SHOT",    label: "Disparada", sub: "sesión tomada",   stampColor: "var(--navy)" },
  { key: "PAID",    label: "Cerrada",   sub: "pago registrado", stampColor: "var(--olive)" },
];

function mapStatus(status: string): string {
  if (status === "SHOT" || status === "DELIVERED") return "SHOT";
  if (status === "PAID" || status === "COMPLETED") return "PAID";
  return "PENDING";
}

const TZ = "America/Argentina/Buenos_Aires";

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ, day: "2-digit", month: "short",
  }).format(new Date(iso)).toUpperCase();
}

function fmtPrice(n: number, currency: string) {
  return currency === "ARS"
    ? new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)
    : new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(n);
}

function SessionCard({ session, isDragging = false }: { session: KanbanSession; isDragging?: boolean }) {
  const isLate = mapStatus(session.status) === "SHOT" && session.daysInStatus > 7;

  return (
    <div style={{
      background: "var(--foto-paper)",
      border: "1px solid var(--foto-rule)",
      padding: "10px 10px 8px",
      marginBottom: 8,
      position: "relative",
      opacity: isDragging ? 0.5 : 1,
      cursor: isDragging ? "grabbing" : "grab",
      userSelect: "none",
    }}>
      {/* Dot-grid header strip */}
      <div style={{
        height: 44,
        margin: "-10px -10px 8px",
        backgroundImage: "radial-gradient(var(--foto-rule) 1px, transparent 1px)",
        backgroundSize: "7px 7px",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--foto-rule)",
      }}>
        {session.driveUrl ? (
          <a href={session.driveUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: "var(--foto-accent)" }}>
            <LuImages size={16} />
          </a>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M7 6l2-3h6l2 3"/>
          </svg>
        )}
      </div>

      <Link
        href={`/fotografia/sesiones/${session.id}`}
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "var(--font-condensed)", fontSize: 16, color: "var(--foto-ink)", textDecoration: "none", display: "block", letterSpacing: "0.02em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: 3 }}
      >
        {session.clientName}
      </Link>

      {session.eventName && (
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 11, color: "var(--foto-ink2)", margin: "0 0 6px", lineHeight: 1.3 }}>
          {session.eventName}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", letterSpacing: "0.08em" }}>
        <span>{fmtDate(session.date)}</span>
        <span style={{ color: "var(--foto-ink)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
          {fmtPrice(session.price, session.currency)} <span style={{ color: "var(--foto-accent)", fontSize: 9 }}>{session.currency}</span>
        </span>
      </div>

      {isLate && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4, color: "var(--rust)", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.06em" }}>
          <LuTriangleAlert size={10} /> {session.daysInStatus}d sin entregar
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
      style={{
        flex: 1,
        minWidth: 220,
        maxWidth: 320,
        background: isOver ? "var(--foto-paper2)" : "transparent",
        outline: isOver ? `2px solid var(--foto-accent)` : "none",
        transition: "background 0.15s",
      }}
    >
      <div style={{ paddingBottom: 10, borderBottom: "2px solid var(--foto-ink)", marginBottom: 12 }}>
        <p style={{ fontFamily: "var(--font-condensed)", fontSize: 18, color: "var(--foto-ink)", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
          {column.label}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)" }}>· {sessions.length}</span>
        </p>
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 11, color: "var(--foto-accent)", margin: "2px 0 0" }}>{column.sub}</p>
      </div>

      <div style={{ minHeight: 80 }}>
        {sessions.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 60, borderBottom: "1px dashed var(--foto-rule)" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--foto-rule)" }}>sin sesiones</p>
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

  const grouped: Record<string, KanbanSession[]> = { PENDING: [], SHOT: [], PAID: [] };
  for (const s of sessions) {
    grouped[mapStatus(s.status)].push(s);
  }

  function handleDragStart({ active }: DragStartEvent) {
    const s = sessions.find((s) => s.id === active.id);
    if (s) setActiveSession(s);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveSession(null);
    setOverColumn(null);

    if (!over) return;
    const targetDisplay = over.id as string;
    const session = sessions.find((s) => s.id === active.id);
    if (!session) return;

    if (mapStatus(session.status) === targetDisplay) return;

    const dbStatus = targetDisplay === "PAID" ? "PAID" : targetDisplay === "SHOT" ? "SHOT" : "PENDING";

    setSessions((prev) =>
      prev.map((s) => s.id === session.id ? { ...s, status: dbStatus } : s)
    );

    const res = await fetch(`/api/fotografia/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: dbStatus }),
    });

    if (!res.ok) {
      toast.error("No se pudo cambiar el estado");
      setSessions(initialSessions);
    } else {
      if (dbStatus === "PAID") {
        toast.success("Sesión cerrada · pago registrado en tu cartera");
      }
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
      <div style={{ overflowX: "auto", paddingBottom: 16 }}>
        <div style={{ display: "flex", gap: 20, minWidth: "max-content" }}>
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
        {activeSession && <SessionCard session={activeSession} />}
      </DragOverlay>
    </DndContext>
  );
}
