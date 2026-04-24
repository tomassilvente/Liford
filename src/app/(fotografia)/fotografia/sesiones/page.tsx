export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import SessionForm from "@/components/fotografia/SessionForm";
import SessionRow from "@/components/fotografia/SessionRow";

const STATUS_TABS = [
  { value: "all", label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "CONFIRMED", label: "Confirmadas" },
  { value: "SHOT", label: "Disparadas" },
  { value: "DELIVERED", label: "Entregadas" },
  { value: "PAID", label: "Pagadas" },
  { value: "COMPLETED", label: "Completadas" },
];

export default async function SesionesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId } = await requireSession();
  const { status } = await searchParams;
  const activeStatus = status ?? "all";

  const [sessions, clients] = await Promise.all([
    db.session.findMany({
      where: {
        client: { userId },
        ...(activeStatus !== "all" ? { status: activeStatus as never } : {}),
      },
      include: { client: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    db.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Sesiones</h1>
      <p className="mt-1 text-neutral-400">Gestioná tus sesiones fotográficas</p>

      <div className="mt-6">
        <SessionForm clients={clients} />
      </div>

      {/* Tabs de filtro — scroll horizontal en mobile */}
      <div className="mt-8 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.value}
            href={tab.value === "all" ? "/fotografia/sesiones" : `/fotografia/sesiones?status=${tab.value}`}
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

      <div className="mt-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {activeStatus === "all" ? "No hay sesiones todavía." : "No hay sesiones con este estado."}
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
