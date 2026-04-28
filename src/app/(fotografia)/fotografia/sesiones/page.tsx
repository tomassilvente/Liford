export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import SessionForm from "@/components/fotografia/SessionForm";
import SessionRow from "@/components/fotografia/SessionRow";
import SessionKanban, { type KanbanSession } from "@/components/fotografia/SessionKanban";
import Link from "next/link";
import { LuLayoutGrid, LuList } from "react-icons/lu";

function currentYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

export default async function SesionesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; mes?: string }>;
}) {
  const { userId } = await requireSession();
  const { view, mes } = await searchParams;
  const activeView = view === "list" ? "list" : "kanban";
  const activeMes = mes ?? "all";

  let dateFilter: { gte: Date; lt: Date } | undefined;
  if (activeMes !== "all") {
    const [y, m] = activeMes.split("-").map(Number);
    dateFilter = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const [sessions, clients] = await Promise.all([
    db.session.findMany({
      where: {
        client: { userId },
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    }),
    db.client.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const now = new Date();

  // Estadísticas rápidas
  const byStatus = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  const pendingPayment  = byStatus["DELIVERED"] ?? 0;
  const pendingDelivery = sessions.filter((s) => {
    if (s.status !== "SHOT") return false;
    const daysInStatus = Math.floor((now.getTime() - s.updatedAt.getTime()) / 86400000);
    return daysInStatus > 7;
  }).length;

  // Datos para Kanban
  const kanbanSessions: KanbanSession[] = sessions.map((s) => ({
    id: s.id,
    clientName: s.client.name,
    clientId: s.client.id,
    type: s.type,
    eventName: s.eventName,
    date: s.date.toISOString(),
    price: s.price,
    currency: s.currency,
    status: s.status,
    driveUrl: s.driveUrl,
    photosDelivered: s.photosDelivered,
    daysInStatus: Math.floor((now.getTime() - s.updatedAt.getTime()) / 86400000),
  }));

  function buildHref(params: Record<string, string>) {
    const p = new URLSearchParams({ view: activeView, ...(activeMes !== "all" ? { mes: activeMes } : {}), ...params });
    return `/fotografia/sesiones?${p.toString()}`;
  }

  const isCurrentMonth = activeMes === currentYM();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sesiones</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {activeView === "kanban" ? "Tu pipeline visual · arrastrá para cambiar de estado" : `${sessions.length} sesiones`}
            {pendingPayment > 0 && (
              <span className="ml-2 rounded-full bg-green-900/40 px-2 py-0.5 text-xs text-green-400 ring-1 ring-green-800/40">
                {pendingPayment} por cobrar
              </span>
            )}
            {pendingDelivery > 0 && (
              <span className="ml-1 rounded-full bg-orange-900/40 px-2 py-0.5 text-xs text-orange-400 ring-1 ring-orange-800/40">
                {pendingDelivery} demoradas
              </span>
            )}
          </p>
        </div>
        <SessionForm clients={clients} />
      </div>

      {/* Controles: vista + filtro mes */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Toggle de vista */}
        <div className="flex rounded-lg bg-neutral-800 p-0.5 ring-1 ring-neutral-700">
          <Link
            href={buildHref({ view: "kanban" })}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeView === "kanban" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <LuLayoutGrid size={12} /> Tablero
          </Link>
          <Link
            href={buildHref({ view: "list" })}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeView === "list" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <LuList size={12} /> Lista
          </Link>
        </div>

        {/* Filtro mes */}
        <div className="flex items-center gap-1">
          {activeMes !== "all" && (
            <>
              <Link href={buildHref({ mes: addMonths(activeMes, -1) })} className="rounded-lg px-2 py-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors">‹</Link>
              <span className="min-w-[140px] text-center text-sm font-medium capitalize text-white">{getLabel(activeMes)}</span>
              <Link
                href={buildHref({ mes: addMonths(activeMes, 1) })}
                className={`rounded-lg px-2 py-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors ${isCurrentMonth ? "opacity-30 pointer-events-none" : ""}`}
              >›</Link>
            </>
          )}
          {activeMes === "all" ? (
            <Link href={buildHref({ mes: currentYM() })} className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 transition-colors">
              Filtrar por mes
            </Link>
          ) : (
            <Link href={buildHref({})} className="ml-1 rounded-lg px-2 py-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              Ver todos
            </Link>
          )}
        </div>
      </div>

      {/* Vista */}
      {sessions.length === 0 ? (
        <p className="text-sm text-neutral-500">No hay sesiones en este período.</p>
      ) : activeView === "kanban" ? (
        <SessionKanban sessions={kanbanSessions} />
      ) : (
        <div className="rounded-xl bg-neutral-800 divide-y divide-neutral-700">
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              id={s.id}
              clientName={s.client.name}
              type={s.type}
              eventName={s.eventName}
              date={s.date.toISOString()}
              durationMinutes={s.durationMinutes}
              price={s.price}
              currency={s.currency}
              photosDelivered={s.photosDelivered}
              status={s.status}
              driveUrl={s.driveUrl}
              notes={s.notes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
