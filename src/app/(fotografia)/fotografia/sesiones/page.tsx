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

  const pendingDelivery = sessions.filter((s) => {
    if (s.status !== "SHOT") return false;
    return Math.floor((now.getTime() - s.updatedAt.getTime()) / 86400000) > 7;
  }).length;

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
      {/* Header */}
      <header style={{ paddingBottom: 16, borderBottom: "4px double var(--foto-ink)", marginBottom: 24 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--foto-accent)", margin: 0, textTransform: "uppercase" }}>I · Sesiones — pipeline</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 }}>
          <h1 style={{ fontFamily: "var(--font-condensed)", fontSize: 52, color: "var(--foto-ink)", margin: 0, lineHeight: 0.9, letterSpacing: "0.02em", textTransform: "uppercase" }}>
            Mesa de luz
          </h1>
          <SessionForm clients={clients} />
        </div>
        {pendingDelivery > 0 && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--rust)", margin: "8px 0 0", letterSpacing: "0.08em" }}>
            ↑ {pendingDelivery} sesión{pendingDelivery !== 1 ? "es" : ""} demorada{pendingDelivery !== 1 ? "s" : ""}
          </p>
        )}
      </header>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        {/* View toggle */}
        <div style={{ display: "flex", border: "1px solid var(--foto-rule)" }}>
          <Link
            href={buildHref({ view: "kanban" })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: activeView === "kanban" ? "var(--foto-ink)" : "transparent", color: activeView === "kanban" ? "var(--foto-paper)" : "var(--foto-accent)", textDecoration: "none", fontFamily: "var(--font-condensed)", fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", borderRight: "1px solid var(--foto-rule)" }}
          >
            <LuLayoutGrid size={12} /> Tablero
          </Link>
          <Link
            href={buildHref({ view: "list" })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: activeView === "list" ? "var(--foto-ink)" : "transparent", color: activeView === "list" ? "var(--foto-paper)" : "var(--foto-accent)", textDecoration: "none", fontFamily: "var(--font-condensed)", fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            <LuList size={12} /> Lista
          </Link>
        </div>

        {/* Month filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {activeMes !== "all" && (
            <>
              <Link href={buildHref({ mes: addMonths(activeMes, -1) })} style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--foto-accent)", textDecoration: "none" }}>‹</Link>
              <span style={{ fontFamily: "var(--font-condensed)", fontSize: 15, color: "var(--foto-ink)", letterSpacing: "0.04em", textTransform: "uppercase", minWidth: 140, textAlign: "center" }}>{getLabel(activeMes)}</span>
              <Link
                href={buildHref({ mes: addMonths(activeMes, 1) })}
                style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--foto-accent)", textDecoration: "none", opacity: isCurrentMonth ? 0.3 : 1, pointerEvents: isCurrentMonth ? "none" : "auto" }}
              >›</Link>
            </>
          )}
          {activeMes === "all" ? (
            <Link href={buildHref({ mes: currentYM() })} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              filtrar por mes
            </Link>
          ) : (
            <Link href={buildHref({})} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-rule)", textDecoration: "none", letterSpacing: "0.06em" }}>
              ver todos
            </Link>
          )}
        </div>
      </div>

      {/* View */}
      {sessions.length === 0 ? (
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--foto-accent)" }}>No hay sesiones en este período.</p>
      ) : activeView === "kanban" ? (
        <SessionKanban sessions={kanbanSessions} />
      ) : (
        <div style={{ border: "1px solid var(--foto-rule)", background: "var(--foto-paper)" }}>
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
