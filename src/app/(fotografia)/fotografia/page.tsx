export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SessionStatus } from "@/generated/prisma/enums";
import Link from "next/link";
import { LuCamera, LuCalendar, LuUsers, LuCircleCheck } from "react-icons/lu";

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
      include: { client: { select: { name: true, instagram: true } } },
      orderBy: { date: "asc" },
    }),
    db.client.findMany({
      where: { userId },
    }),
  ]);

  // ── Este mes ──────────────────────────────────────────────────────────────
  const thisMes = allSessions.filter((s) => s.date >= startOfMonth && s.date < endOfMonth);
  const revenueMesARS = thisMes.filter((s) => s.currency === "ARS").reduce((sum, s) => sum + s.price, 0);
  const revenueMesUSD = thisMes.filter((s) => s.currency === "USD").reduce((sum, s) => sum + s.price, 0);

  // ── Próximas sesiones ─────────────────────────────────────────────────────
  const upcoming = allSessions
    .filter((s) => s.date >= now && (s.status === SessionStatus.PENDING || s.status === SessionStatus.CONFIRMED))
    .slice(0, 5);

  // ── Sesiones por estado ───────────────────────────────────────────────────
  const byStatus: Record<string, number> = {};
  for (const s of allSessions) {
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
  }

  // ── Últimas sesiones ──────────────────────────────────────────────────────
  const recent = [...allSessions].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  const mesLabel = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fotografía</h1>
        <p className="mt-1 text-neutral-400 capitalize">
          {now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Stats del mes ── */}
      <section>
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500 capitalize">{mesLabel}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-sm text-neutral-400">Sesiones</p>
            <p className="mt-2 text-2xl font-bold text-white">{thisMes.length}</p>
            <p className="mt-1 text-sm text-neutral-600">este mes</p>
          </div>
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-sm text-neutral-400">Revenue ARS</p>
            <p className="mt-2 text-xl font-bold text-white">
              {revenueMesARS > 0 ? fmtARS(revenueMesARS) : "—"}
            </p>
            <p className="mt-1 text-sm text-neutral-600">este mes</p>
          </div>
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-sm text-neutral-400">Revenue USD</p>
            <p className="mt-2 text-xl font-bold text-white">
              {revenueMesUSD > 0 ? fmtUSD(revenueMesUSD) : "—"}
            </p>
            <p className="mt-1 text-sm text-neutral-600">este mes</p>
          </div>
          <div className="rounded-xl bg-neutral-800 p-5">
            <p className="text-sm text-neutral-400">Clientes</p>
            <p className="mt-2 text-2xl font-bold text-white">{clients.length}</p>
            <Link href="/fotografia/clientes" className="mt-1 block text-sm text-neutral-600 hover:text-neutral-400">
              ver todos →
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Próximas sesiones ── */}
        <section>
          <div className="rounded-xl bg-neutral-800 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Próximas sesiones</p>
              <Link href="/fotografia/sesiones" className="text-sm text-neutral-500 hover:text-neutral-300">
                ver todas →
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <LuCalendar size={24} className="text-neutral-600" />
                <p className="mt-2 text-sm text-neutral-600">No hay sesiones próximas</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-neutral-700">
                {upcoming.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-700">
                        <LuCamera size={16} className="text-neutral-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{s.client.name}</p>
                        <p className="text-sm text-neutral-500">
                          {TYPE_LABELS[s.type]} · {fmtDateTime(s.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                      <p className="text-xs text-neutral-500">
                        {s.currency === "ARS" ? fmtARS(s.price) : fmtUSD(s.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Por estado ── */}
        <div className="flex flex-col gap-4">
          <section>
            <div className="rounded-xl bg-neutral-800 p-5">
              <p className="mb-4 text-sm font-medium text-white">Sesiones por estado</p>
              {allSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <LuCircleCheck size={24} className="text-neutral-600" />
                  <p className="mt-2 text-sm text-neutral-600">Todavía no hay sesiones</p>
                  <Link href="/fotografia/sesiones" className="mt-2 text-sm text-neutral-500 hover:text-neutral-300">
                    Crear primera sesión →
                  </Link>
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

          {/* ── Últimas sesiones ── */}
          <section>
            <div className="rounded-xl bg-neutral-800 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-white">Últimas sesiones</p>
              </div>
              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <LuUsers size={24} className="text-neutral-600" />
                  <p className="mt-2 text-sm text-neutral-600">Sin historial aún</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-neutral-700">
                  {recent.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm text-white">{s.client.name}</p>
                        <p className="text-sm text-neutral-500">{TYPE_LABELS[s.type]} · {fmtDateTime(s.date)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
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
    </div>
  );
}
