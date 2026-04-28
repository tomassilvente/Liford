export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LuArrowLeft, LuInstagram, LuPhone, LuCalendarPlus, LuMessageCircle } from "react-icons/lu";

const TZ = "America/Argentina/Buenos_Aires";

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ, weekday: "short", day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(iso));
}

function fmtPrice(n: number, currency: string) {
  return currency === "ARS"
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

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

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireSession();
  const { id } = await params;

  const client = await db.client.findFirst({
    where: { id, userId },
    include: { sessions: { orderBy: { date: "desc" } } },
  });

  if (!client) notFound();

  const now = new Date();
  const sessions = client.sessions;

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === "COMPLETED" || s.status === "PAID").length;

  // LTV — suma de sesiones pagadas/completadas en ARS y USD por separado
  let ltvARS = 0;
  let ltvUSD = 0;
  for (const s of sessions) {
    if (s.status === "COMPLETED" || s.status === "PAID") {
      if (s.currency === "ARS") ltvARS += s.price;
      else ltvUSD += s.price;
    }
  }

  const avgARS = completedSessions > 0 ? ltvARS / completedSessions : 0;
  const avgUSD = completedSessions > 0 ? ltvUSD / completedSessions : 0;

  // Próxima sesión
  const nextSession = sessions.find((s) => new Date(s.date) > now && s.status !== "COMPLETED" && s.status !== "PAID");

  // Sesiones pendientes de cobro
  const pendingPayment = sessions.filter((s) => s.status === "DELIVERED").length;

  // WhatsApp link
  const phone = client.phone?.replace(/\D/g, "");
  const whatsappUrl = phone ? `https://wa.me/${phone.startsWith("54") ? phone : `54${phone}`}` : null;

  // Nueva sesión pre-poblada con el cliente
  const newSessionUrl = `/fotografia/sesiones`;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/fotografia/clientes" className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
          <LuArrowLeft size={14} /> Clientes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar con iniciales + gradient */}
            {(() => {
              const initials = client.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
              const GRADIENTS = [
                "from-blue-600 to-indigo-700",
                "from-violet-600 to-purple-700",
                "from-rose-600 to-pink-700",
                "from-emerald-600 to-teal-700",
                "from-amber-600 to-orange-700",
                "from-cyan-600 to-sky-700",
              ];
              const gradient = GRADIENTS[client.name.charCodeAt(0) % GRADIENTS.length];
              const clientSince = new Date(client.createdAt).toLocaleDateString("es-AR", { month: "short", year: "numeric" });
              return (
                <>
                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-lg font-bold text-white select-none`}>
                    {initials}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{client.name}</h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      {client.instagram && (
                        <a
                          href={`https://instagram.com/${client.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-pink-400 transition-colors"
                        >
                          <LuInstagram size={13} />
                          {client.instagram}
                        </a>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                          <LuPhone size={13} />
                          {client.phone}
                        </span>
                      )}
                      <span className="text-xs text-neutral-600">Cliente desde {clientSince}</span>
                    </div>
                    {client.notes && <p className="mt-1 text-xs text-neutral-600">{client.notes}</p>}
                  </div>
                </>
              );
            })()}
          </div>
          <div className="flex gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
              >
                <LuMessageCircle size={14} /> WhatsApp
              </a>
            )}
            <Link
              href={newSessionUrl}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
            >
              <LuCalendarPlus size={14} /> Nueva sesión
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-neutral-800 p-4">
          <p className="text-xs text-neutral-400">Sesiones</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalSessions}</p>
          <p className="mt-0.5 text-xs text-neutral-600">{completedSessions} completadas</p>
        </div>
        {ltvARS > 0 && (
          <div className="rounded-xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">LTV ARS</p>
            <p className="mt-1 text-2xl font-bold text-white">{fmtPrice(ltvARS, "ARS")}</p>
            {avgARS > 0 && <p className="mt-0.5 text-xs text-neutral-600">Prom. {fmtPrice(avgARS, "ARS")}</p>}
          </div>
        )}
        {ltvUSD > 0 && (
          <div className="rounded-xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">LTV USD</p>
            <p className="mt-1 text-2xl font-bold text-white">{fmtPrice(ltvUSD, "USD")}</p>
            {avgUSD > 0 && <p className="mt-0.5 text-xs text-neutral-600">Prom. {fmtPrice(avgUSD, "USD")}</p>}
          </div>
        )}
        {pendingPayment > 0 && (
          <div className="rounded-xl bg-green-950 p-4 ring-1 ring-green-900/40">
            <p className="text-xs text-neutral-400">Por cobrar</p>
            <p className="mt-1 text-2xl font-bold text-green-400">{pendingPayment}</p>
            <p className="mt-0.5 text-xs text-green-700">sesión{pendingPayment !== 1 ? "es" : ""} entregada{pendingPayment !== 1 ? "s" : ""}</p>
          </div>
        )}
      </div>

      {/* Próxima sesión */}
      {nextSession && (
        <div className="mb-6 rounded-xl bg-blue-950/30 p-4 ring-1 ring-blue-900/30">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-blue-400">Próxima sesión</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{fmtDate(nextSession.date.toISOString())}</p>
              <p className="text-xs text-neutral-500">
                {nextSession.type === "SPORT" ? "Deporte" : nextSession.type === "EVENT" ? "Evento" : "Otro"}
                {nextSession.eventName ? ` — ${nextSession.eventName}` : ""}
                {" · "}{fmtPrice(nextSession.price, nextSession.currency)}
              </p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[nextSession.status]}`}>
              {STATUS_LABELS[nextSession.status]}
            </span>
          </div>
        </div>
      )}

      {/* Historial de sesiones */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Historial de sesiones</p>
        {sessions.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin sesiones todavía.</p>
        ) : (
          <div className="rounded-xl bg-neutral-800 divide-y divide-neutral-700">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/fotografia/sesiones/${s.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-700/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white capitalize">{fmtDate(s.date.toISOString())}</p>
                  <p className="text-xs text-neutral-500">
                    {s.type === "SPORT" ? "Deporte" : s.type === "EVENT" ? "Evento" : "Otro"}
                    {s.eventName ? ` — ${s.eventName}` : ""}
                    {s.photosDelivered ? ` · ${s.photosDelivered} fotos` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                    {STATUS_LABELS[s.status]}
                  </span>
                  <span className="text-sm font-semibold text-neutral-300 tabular-nums">
                    {fmtPrice(s.price, s.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
