"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { LuPencil, LuTrash2, LuCheck, LuX, LuEllipsis, LuExternalLink, LuImages } from "react-icons/lu";

const TZ = "America/Argentina/Buenos_Aires";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "SHOT", label: "Disparada" },
  { value: "DELIVERED", label: "Entregada" },
  { value: "PAID", label: "Pagada" },
  { value: "COMPLETED", label: "Completada" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  CONFIRMED: "text-blue-400 bg-blue-400/10",
  SHOT: "text-purple-400 bg-purple-400/10",
  DELIVERED: "text-cyan-400 bg-cyan-400/10",
  PAID: "text-green-400 bg-green-400/10",
  COMPLETED: "text-neutral-400 bg-neutral-400/10",
};

const TYPE_LABELS: Record<string, string> = {
  SPORT: "Deporte",
  EVENT: "Evento",
  OTHER: "Otro",
};

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  const hasTime = time !== "00:00";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

function toLocalDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

function toLocalTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
}

interface SessionRowProps {
  id: string;
  clientName: string;
  type: string;
  eventName: string | null;
  date: string;
  durationMinutes: number | null;
  price: number;
  currency: string;
  photosDelivered: number | null;
  status: string;
  driveUrl: string | null;
  notes: string | null;
}

export default function SessionRow(props: SessionRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState(props.status);
  const [editDate, setEditDate] = useState(toLocalDate(props.date));
  const [editTime, setEditTime] = useState(toLocalTime(props.date));
  const [price, setPrice] = useState(String(props.price));
  const [currency, setCurrency] = useState(props.currency);
  const [durationMinutes, setDurationMinutes] = useState(props.durationMinutes ? String(props.durationMinutes) : "");
  const [photosDelivered, setPhotosDelivered] = useState(props.photosDelivered ? String(props.photosDelivered) : "");
  const [driveUrl, setDriveUrl] = useState(props.driveUrl ?? "");
  const [notes, setNotes] = useState(props.notes ?? "");

  function resetEdit() {
    setStatus(props.status);
    setEditDate(toLocalDate(props.date));
    setEditTime(toLocalTime(props.date));
    setPrice(String(props.price));
    setCurrency(props.currency);
    setDurationMinutes(props.durationMinutes ? String(props.durationMinutes) : "");
    setPhotosDelivered(props.photosDelivered ? String(props.photosDelivered) : "");
    setDriveUrl(props.driveUrl ?? "");
    setNotes(props.notes ?? "");
    setEditing(false);
  }

  async function handleSave() {
    setLoading(true);
    const res = await fetch(`/api/fotografia/sessions/${props.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        date: `${editDate}T${editTime || "00:00"}:00-03:00`,
        price: Number(price),
        currency,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        photosDelivered: photosDelivered ? Number(photosDelivered) : null,
        driveUrl: driveUrl || null,
        notes: notes || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Sesión actualizada");
      setEditing(false);
      router.refresh();
    } else {
      toast.error("No se pudo actualizar");
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/fotografia/sessions/${props.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Sesión eliminada");
      router.refresh();
    } else {
      toast.error("No se pudo eliminar");
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          {/* Estado */}
          <div>
            <p className="mb-1 text-xs text-neutral-500">Estado</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <p className="mb-1 text-xs text-neutral-500">Fecha</p>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500 [color-scheme:dark]"
            />
          </div>

          {/* Hora */}
          <div>
            <p className="mb-1 text-xs text-neutral-500">Hora</p>
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500 [color-scheme:dark]"
            />
          </div>

          {/* Precio */}
          <div>
            <p className="mb-1 text-xs text-neutral-500">Precio</p>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>

          {/* Moneda */}
          <div>
            <p className="mb-1 text-xs text-neutral-500">Moneda</p>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {/* Duración */}
          <div>
            <p className="mb-1 text-xs text-neutral-500">Duración (min)</p>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              min="0"
              placeholder="—"
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>

          {/* Fotos entregadas */}
          <div>
            <p className="mb-1 text-xs text-neutral-500">Fotos entregadas</p>
            <input
              type="number"
              value={photosDelivered}
              onChange={(e) => setPhotosDelivered(e.target.value)}
              min="0"
              placeholder="—"
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>

          {/* Drive URL */}
          <div className="col-span-2">
            <p className="mb-1 text-xs text-neutral-500">Link Drive</p>
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <p className="mb-1 text-xs text-neutral-500">Notas</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <LuCheck size={13} />
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            onClick={resetEdit}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-600"
          >
            <LuX size={13} />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/fotografia/sesiones/${props.id}`}
            className="truncate text-sm font-medium text-white hover:text-blue-400 transition-colors"
          >
            {props.clientName}
          </Link>
          {props.driveUrl && (
            <a
              href={props.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-neutral-500 hover:text-cyan-400 transition-colors"
              title="Ver carpeta en Drive"
            >
              <LuImages size={12} />
            </a>
          )}
        </div>
        <p className="truncate text-xs text-neutral-500">
          {TYPE_LABELS[props.type]}
          {props.eventName ? ` — ${props.eventName}` : ""}
          {" · "}{fmtDateTime(props.date)}
          {props.photosDelivered ? ` · ${props.photosDelivered} fotos` : ""}
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[props.status]}`}>
          {STATUS_OPTIONS.find((o) => o.value === props.status)?.label ?? props.status}
        </span>
        <p className="text-xs text-neutral-500">
          {props.currency === "ARS" ? fmtARS(props.price) : fmtUSD(props.price)}
        </p>
      </div>

      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-700 hover:text-neutral-300 transition-colors"
        >
          <LuEllipsis size={15} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirmingDelete(false); }} />
            <div className="absolute right-0 bottom-full z-20 mb-1 flex flex-col overflow-hidden rounded-lg bg-neutral-700 shadow-lg">
              {!confirmingDelete ? (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); setEditing(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-200 hover:bg-neutral-600"
                  >
                    <LuPencil size={13} />
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-neutral-600"
                  >
                    <LuTrash2 size={13} />
                    Eliminar
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-1 p-2 w-44">
                  <p className="px-2 py-1 text-xs text-neutral-400">¿Eliminar esta sesión?</p>
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmingDelete(false); handleDelete(); }}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="rounded-md bg-neutral-600 px-3 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-500"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
