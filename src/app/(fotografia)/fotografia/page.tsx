export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SessionStatus } from "@/generated/prisma/enums";
import Link from "next/link";
import { LuCalendar, LuUsers, LuCircleCheck, LuPlus } from "react-icons/lu";

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

const TZ = "America/Argentina/Buenos_Aires";

function fmtDateTime(date: Date) {
  const time = date.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  const hasTime = time !== "00:00";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function getDayInfo(date: Date) {
  const d = new Date(date);
  return {
    day: d.toLocaleDateString("es-AR", { timeZone: TZ, day: "2-digit" }),
    weekday: d.toLocaleDateString("es-AR", { timeZone: TZ, weekday: "short" }).toUpperCase(),
    month: d.toLocaleDateString("es-AR", { timeZone: TZ, month: "short" }).toUpperCase(),
    time: d.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function isToday(date: Date) {
  const now = new Date();
  const d = new Date(date);
  return (
    d.toLocaleDateString("es-AR", { timeZone: TZ }) ===
    now.toLocaleDateString("es-AR", { timeZone: TZ })
  );
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  SHOT: "Disparada",
  DELIVERED: "Entregada",
  PAID: "Pagada",
  COMPLETED: "Completada",
};

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

export default async function FotografiaDashboard() {
  const session = await requireSession();
  const userId = session.userId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [allSessions, clients] = await Promise.all([
    db.session.findMany({
      where: { client: { userId } },
      include: { client: { select: { name: true } } },
      orderBy: { date: "asc" },
    }),
    db.client.findMany({ where: { userId } }),
  ]);

  const thisMes = allSessions.filter((s) => s.date >= startOfMonth && s.date < endOfMonth);
  const revenueMesARS = thisMes.filter((s) => s.currency === "ARS").reduce((sum, s) => sum + s.price, 0);
  const revenueMesUSD = thisMes.filter((s) => s.currency === "USD").reduce((sum, s) => sum + s.price, 0);

  const upcoming = allSessions
    .filter((s) => s.date >= now && (s.status === SessionStatus.PENDING || s.status === SessionStatus.CONFIRMED))
    .slice(0, 6);

  const byStatus: Record<string, number> = {};
  for (const s of allSessions) {
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
  }

  const recent = [...allSessions]
    .filter((s) => s.date < now || (s.status !== SessionStatus.PENDING && s.status !== SessionStatus.CONFIRMED))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 4);

  const mesLabel = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Fotografía</h1>
          <p className="mt-1 text-neutral-400 capitalize">
            {now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Link
          href="/fotografia/sesiones"
          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <LuPlus size={15} />
          Nueva sesión
        </Link>
      </div>

      {/* ── PRÓXIMAS SESIONES — destacado ── */}
      <section>
        <div className="rounded-2xl bg-neutral-800 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Próximas sesiones</p>
              {upcoming.length > 0 && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  {upcoming.length} {upcoming.length === 1 ? "sesión pactada" : "sesiones pactadas"}
                </p>
              )}
            </div>
            <Link href="/fotografia/sesiones" className="text-sm text-neutral-500 hover:text-neutral-300">
              ver todas →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <LuCalendar size={28} className="text-neutral-600" />
              <p className="mt-3 text-sm text-neutral-500">No hay sesiones pactadas</p>
              <Link
                href="/fotografia/sesiones"
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-600 transition-colors"
              >
                <LuPlus size={13} />
                Crear sesión
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {upcoming.map((s) => {
                const { day, weekday, month, time } = getDayInfo(s.date);
                const today = isToday(s.date);
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 rounded-xl p-3 ${
                      today
                        ? "bg-blue-500/10 ring-1 ring-blue-500/30"
                        : "bg-neutral-900/70"
                    }`}
                  >
                    {/* Chip de fecha + hora */}
                    <div className={`flex w-14 flex-shrink-0 flex-col items-center rounded-lg py-2 ${
                      today ? "bg-blue-500/20" : "bg-neutral-800"
                    }`}>
                      <span className={`text-[10px] font-semibold tracking-wide ${today ? "text-blue-400" : "text-neutral-500"}`}>
                        {weekday}
                      </span>
                      <span className={`text-xl font-bold leading-tight ${today ? "text-blue-300" : "text-white"}`}>
                        {day}
                      </span>
                      <span className={`text-[10px] ${today ? "text-blue-400" : "text-neutral-500"}`}>
                        {month}
                      </span>
                      {time !== "00:00" && (
                        <>
                          <div className={`my-1.5 h-px w-6 ${today ? "bg-blue-500/40" : "bg-neutral-700"}`} />
                          <span className={`text-xs font-semibold tabular-nums ${today ? "text-blue-300" : "text-neutral-300"}`}>
                            {time}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{s.client.name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {TYPE_LABELS[s.type]}
                        {s.eventName ? ` — ${s.eventName}` : ""}
                      </p>
                    </div>

                    {/* Estado + precio */}
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                      <p className="text-xs text-neutral-500">
                        {s.currency === "ARS" ? fmtARS(s.price) : fmtUSD(s.price)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Stats del mes ── */}
      <section>
        <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-neutral-600 capitalize">{mesLabel}</p>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="rounded-xl bg-neutral-800/60 p-4">
            <p className="text-xs text-neutral-500">Sesiones</p>
            <p className="mt-1.5 text-xl font-bold text-white">{thisMes.length}</p>
          </div>
          <div className="rounded-xl bg-neutral-800/60 p-4">
            <p className="text-xs text-neutral-500">Revenue ARS</p>
            <p className="mt-1.5 truncate text-lg font-bold text-white">
              {revenueMesARS > 0 ? fmtARS(revenueMesARS) : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-800/60 p-4">
            <p className="text-xs text-neutral-500">Revenue USD</p>
            <p className="mt-1.5 truncate text-lg font-bold text-white">
              {revenueMesUSD > 0 ? fmtUSD(revenueMesUSD) : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-800/60 p-4">
            <p className="text-xs text-neutral-500">Clientes</p>
            <p className="mt-1.5 text-xl font-bold text-white">{clients.length}</p>
          </div>
        </div>
      </section>

      {/* ── Estados + Últimas ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section>
          <div className="rounded-xl bg-neutral-800 p-4 sm:p-5">
            <p className="mb-3 text-sm font-medium text-white">Por estado</p>
            {allSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <LuCircleCheck size={20} className="text-neutral-600" />
                <p className="mt-2 text-sm text-neutral-600">Todavía no hay sesiones</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(STATUS_LABELS).map(([status, label]) => {
                  const count = byStatus[status] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status].split(" ")[0].replace("text-", "bg-")}`} />
                        <p className="text-sm text-neutral-400">{label}</p>
                      </div>
                      <p className="text-sm font-medium text-white">{count}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="rounded-xl bg-neutral-800 p-4 sm:p-5">
            <p className="mb-3 text-sm font-medium text-white">Historial reciente</p>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <LuUsers size={20} className="text-neutral-600" />
                <p className="mt-2 text-sm text-neutral-600">Sin historial aún</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-neutral-700">
                {recent.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{s.client.name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {TYPE_LABELS[s.type]} · {fmtDateTime(s.date)}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
