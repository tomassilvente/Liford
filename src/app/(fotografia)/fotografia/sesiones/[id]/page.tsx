export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { extractFolderId, listPhotosInFolder } from "@/lib/google-drive";
import PhotoBrowser from "@/components/fotografia/PhotoBrowser";
import Link from "next/link";
import { LuArrowLeft, LuCalendar, LuExternalLink } from "react-icons/lu";

const TZ = "America/Argentina/Buenos_Aires";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmada", SHOT: "Disparada",
  DELIVERED: "Entregada", PAID: "Pagada", COMPLETED: "Completada",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  CONFIRMED: "text-blue-400 bg-blue-400/10",
  SHOT: "text-purple-400 bg-purple-400/10",
  DELIVERED: "text-cyan-400 bg-cyan-400/10",
  PAID: "text-green-400 bg-green-400/10",
  COMPLETED: "text-neutral-400 bg-neutral-400/10",
};
const TYPE_LABELS: Record<string, string> = { SPORT: "Deporte", EVENT: "Evento", OTHER: "Otro" };

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}
function fmtDateTime(date: Date) {
  const time = date.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  const hasTime = time !== "00:00";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ, weekday: "long", day: "2-digit", month: "long", year: "numeric",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireSession();
  const { id } = await params;

  const session = await db.session.findUnique({
    where: { id },
    include: { client: { select: { name: true, instagram: true, phone: true } } },
  });

  if (!session) notFound();

  // Verificar ownership
  const ownership = await db.client.findUnique({
    where: { id: session.clientId, userId },
  });
  if (!ownership) notFound();

  // Fotos de Drive si hay carpeta vinculada
  const folderId = session.driveUrl ? extractFolderId(session.driveUrl) : null;
  const photos = folderId ? await listPhotosInFolder(folderId) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/fotografia/sesiones"
          className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <LuArrowLeft size={14} />
          Volver a sesiones
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{session.client.name}</h1>
            <p className="mt-1 capitalize text-neutral-400">{fmtDateTime(session.date)}</p>
          </div>
          <span className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[session.status]}`}>
            {STATUS_LABELS[session.status]}
          </span>
        </div>
      </div>

      {/* Info de la sesión */}
      <section className="rounded-xl bg-neutral-800 p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-neutral-500">Tipo</p>
            <p className="mt-1 text-sm text-white">{TYPE_LABELS[session.type]}{session.eventName ? ` — ${session.eventName}` : ""}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Precio</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {session.currency === "ARS" ? fmtARS(session.price) : fmtUSD(session.price)}
            </p>
          </div>
          {session.durationMinutes && (
            <div>
              <p className="text-xs text-neutral-500">Duración</p>
              <p className="mt-1 text-sm text-white">{session.durationMinutes} min</p>
            </div>
          )}
          {session.photosDelivered && (
            <div>
              <p className="text-xs text-neutral-500">Fotos entregadas</p>
              <p className="mt-1 text-sm text-white">{session.photosDelivered}</p>
            </div>
          )}
          {session.client.instagram && (
            <div>
              <p className="text-xs text-neutral-500">Instagram</p>
              <p className="mt-1 text-sm text-white">@{session.client.instagram}</p>
            </div>
          )}
          {session.client.phone && (
            <div>
              <p className="text-xs text-neutral-500">Teléfono</p>
              <p className="mt-1 text-sm text-white">{session.client.phone}</p>
            </div>
          )}
        </div>
        {session.notes && (
          <div className="mt-4 border-t border-neutral-700 pt-4">
            <p className="text-xs text-neutral-500">Notas</p>
            <p className="mt-1 text-sm text-neutral-300">{session.notes}</p>
          </div>
        )}
        {session.googleCalendarId && (
          <div className="mt-4 border-t border-neutral-700 pt-4">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <LuCalendar size={13} />
              <span>Evento en Google Calendar</span>
            </div>
          </div>
        )}
      </section>

      {/* Photos */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-white">Fotos</p>
          {session.driveUrl && (
            <a
              href={session.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <LuExternalLink size={13} />
              Carpeta en Drive
            </a>
          )}
        </div>

        <div className="rounded-xl bg-neutral-800 p-4 sm:p-5">
          {!session.driveUrl ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-neutral-500">No hay carpeta de Drive vinculada.</p>
              <p className="mt-1 text-xs text-neutral-600">Editá la sesión y agregá el link de Drive.</p>
            </div>
          ) : (
            <PhotoBrowser photos={photos} folderUrl={session.driveUrl} />
          )}
        </div>
      </section>
    </div>
  );
}
