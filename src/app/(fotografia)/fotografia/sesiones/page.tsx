export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import SessionForm from "@/components/fotografia/SessionForm";
import SessionRow from "@/components/fotografia/SessionRow";
import MonthFilter from "@/components/finanzas/MonthFilter";

const STATUS_TABS = [
  { value: "all", label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "CONFIRMED", label: "Confirmadas" },
  { value: "SHOT", label: "Disparadas" },
  { value: "DELIVERED", label: "Entregadas" },
  { value: "PAID", label: "Pagadas" },
  { value: "COMPLETED", label: "Completadas" },
];

function currentYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function SesionesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mes?: string }>;
}) {
  const { userId } = await requireSession();
  const { status, mes } = await searchParams;
  const activeStatus = status ?? "all";
  const activeMes = mes ?? "all";

  // Rango de fechas si hay filtro de mes
  let dateFilter: { gte: Date; lt: Date } | undefined;
  if (activeMes !== "all") {
    const [y, m] = activeMes.split("-").map(Number);
    dateFilter = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  }

  const [sessions, clients] = await Promise.all([
    db.session.findMany({
      where: {
        client: { userId },
        ...(activeStatus !== "all" ? { status: activeStatus as never } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { client: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    db.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  // Construye la URL del tab manteniendo el filtro de mes activo
  function tabHref(statusValue: string) {
    const params = new URLSearchParams();
    if (statusValue !== "all") params.set("status", statusValue);
    if (activeMes !== "all") params.set("mes", activeMes);
    const q = params.toString();
    return `/fotografia/sesiones${q ? `?${q}` : ""}`;
  }

  // Construye la URL del MonthFilter manteniendo el filtro de status activo
  function mesHref(newMes: string) {
    const params = new URLSearchParams();
    if (activeStatus !== "all") params.set("status", activeStatus);
    if (newMes !== "all") params.set("mes", newMes);
    return `/fotografia/sesiones?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Sesiones</h1>
      <p className="mt-1 text-neutral-400">Gestioná tus sesiones fotográficas</p>

      <div className="mt-6">
        <SessionForm clients={clients} />
      </div>

      {/* Filtros */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs de estado — scroll horizontal en mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUS_TABS.map((tab) => (
            <a
              key={tab.value}
              href={tabHref(tab.value)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeStatus === tab.value
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {/* Filtro de mes */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeMes !== "all" && (
            <a
              href={tabHref(activeStatus)}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Ver todos los meses
            </a>
          )}
          <MonthFilterSesiones
            selected={activeMes === "all" ? currentYM() : activeMes}
            showingAll={activeMes === "all"}
            buildHref={mesHref}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="mt-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {activeMes !== "all"
              ? "No hay sesiones en este mes."
              : activeStatus === "all"
              ? "No hay sesiones todavía."
              : "No hay sesiones con este estado."}
          </p>
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
    </div>
  );
}

// Versión del MonthFilter adaptada para sesiones (controla su propio href)
function MonthFilterSesiones({
  selected,
  showingAll,
  buildHref,
}: {
  selected: string;
  showingAll: boolean;
  buildHref: (mes: string) => string;
}) {
  function addMonths(ym: string, delta: number) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function getLabel(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  }

  const isCurrentMonth = selected === currentYM();

  return (
    <div className="flex items-center gap-1">
      {!showingAll && (
        <>
          <a
            href={buildHref(addMonths(selected, -1))}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            ‹
          </a>
          <span className="min-w-[130px] text-center text-sm font-medium capitalize text-white">
            {getLabel(selected)}
          </span>
          <a
            href={buildHref(addMonths(selected, 1))}
            className={`rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors ${isCurrentMonth ? "opacity-30 pointer-events-none" : ""}`}
          >
            ›
          </a>
        </>
      )}
      {!showingAll && !isCurrentMonth && (
        <a href={buildHref(currentYM())} className="ml-1 rounded-lg px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors">
          Hoy
        </a>
      )}
      {showingAll && (
        <a href={buildHref(currentYM())} className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 transition-colors">
          Filtrar por mes
        </a>
      )}
    </div>
  );
}
