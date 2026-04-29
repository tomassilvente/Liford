export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SessionStatus } from "@/generated/prisma/enums";
import Link from "next/link";
import { LuPlus, LuCalendar } from "react-icons/lu";

const fmtARS = (n: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(n);
const fmtMoney = (n: number, cur: string) => cur === "USD" ? `${fmtUSD(n)} USD` : `${fmtARS(n)} ARS`;

const TZ = "America/Argentina/Buenos_Aires";

function isToday(date: Date) {
  const now = new Date();
  return date.toLocaleDateString("es-AR", { timeZone: TZ }) === now.toLocaleDateString("es-AR", { timeZone: TZ });
}

function isTomorrow(date: Date) {
  const tom = new Date(); tom.setDate(tom.getDate() + 1);
  return date.toLocaleDateString("es-AR", { timeZone: TZ }) === tom.toLocaleDateString("es-AR", { timeZone: TZ });
}

function fmtRelDate(date: Date): string {
  if (isToday(date))    return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  return date.toLocaleDateString("es-AR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
}

function fmtTime(date: Date): string | null {
  const t = date.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  return t === "00:00" ? null : t;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Pendiente",
  CONFIRMED: "Confirmada",
  SHOT:      "Disparada",
  DELIVERED: "Entregada",
  PAID:      "Pagada",
  COMPLETED: "Completada",
};

const TYPE_LABELS: Record<string, string> = {
  SPORT: "Deporte", EVENT: "Evento", OTHER: "Otro",
};

export default async function FotografiaDashboard() {
  const { userId } = await requireSession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [allSessions, clients] = await Promise.all([
    db.session.findMany({
      where: { client: { userId } },
      include: { client: { select: { name: true } } },
      orderBy: { date: "asc" },
    }),
    db.client.findMany({ where: { userId } }),
  ]);

  const thisMes       = allSessions.filter((s) => s.date >= startOfMonth && s.date < endOfMonth);
  const revenueMesARS = thisMes.filter((s) => s.currency === "ARS").reduce((sum, s) => sum + s.price, 0);
  const revenueMesUSD = thisMes.filter((s) => s.currency === "USD").reduce((sum, s) => sum + s.price, 0);

  const upcoming = allSessions
    .filter((s) => s.date >= now && (s.status === SessionStatus.PENDING || s.status === SessionStatus.CONFIRMED))
    .slice(0, 5);

  const pendingEdit    = allSessions.filter((s) => s.status === SessionStatus.SHOT).length;
  const pendingPayment = allSessions.filter((s) => s.status === SessionStatus.DELIVERED).length;

  const recent = [...allSessions]
    .filter((s) => s.date < now || s.status === SessionStatus.SHOT || s.status === SessionStatus.DELIVERED)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 4);

  const mesLabel = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: 0, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            {now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontStyle: "italic", color: "var(--foto-ink)", margin: "2px 0 0", lineHeight: 1, letterSpacing: "-0.01em" }}>
            Fotografía
          </h1>
        </div>
        <Link href="/fotografia/sesiones" style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--foto-ink)", color: "var(--foto-paper)", padding: "9px 16px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", flexShrink: 0 }}>
          <LuPlus size={14} /> Sesión
        </Link>
      </div>

      {/* ── Alertas operativas ───────────────────────────────────── */}
      {(pendingEdit > 0 || pendingPayment > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pendingEdit > 0 && (
            <Link href="/fotografia/sesiones" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--foto-paper2)", borderLeft: "4px solid var(--foto-ink)", textDecoration: "none" }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--foto-ink)" }}>
                {pendingEdit} sesión{pendingEdit !== 1 ? "es" : ""} por editar
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)" }}>→</span>
            </Link>
          )}
          {pendingPayment > 0 && (
            <Link href="/fotografia/sesiones" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--foto-paper2)", borderLeft: "4px solid var(--olive)", textDecoration: "none" }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--foto-ink)" }}>
                {pendingPayment} sesión{pendingPayment !== 1 ? "es" : ""} por cobrar
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)" }}>→</span>
            </Link>
          )}
        </div>
      )}

      {/* ── Próximas sesiones ─────────────────────────────────────── */}
      <section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 600, color: "var(--foto-ink)", margin: 0 }}>
            Próximas
          </p>
          <Link href="/fotografia/sesiones" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", textDecoration: "none", letterSpacing: "0.06em" }}>
            ver todas →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "28px 0", textAlign: "center", border: "1px dashed var(--foto-rule)" }}>
            <LuCalendar size={20} style={{ color: "var(--foto-rule)" }} />
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--foto-rule)", margin: 0 }}>No hay sesiones pactadas</p>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--foto-rule)" }}>
            {upcoming.map((s, i) => {
              const today    = isToday(s.date);
              const tomorrow = isTomorrow(s.date);
              const time     = fmtTime(s.date);
              return (
                <Link
                  key={s.id}
                  href={`/fotografia/sesiones/${s.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px",
                    borderBottom: i < upcoming.length - 1 ? "1px solid var(--foto-rule)" : "none",
                    background: today ? "var(--foto-paper2)" : "var(--foto-paper)",
                    textDecoration: "none",
                  }}
                >
                  {/* Date pill */}
                  <div style={{
                    flexShrink: 0, width: 44, textAlign: "center",
                    padding: "6px 0",
                    background: today ? "var(--foto-ink)" : "transparent",
                    border: `1px solid ${today ? "var(--foto-ink)" : "var(--foto-rule)"}`,
                  }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: today ? "var(--foto-paper)" : "var(--foto-accent)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {s.date.toLocaleDateString("es-AR", { timeZone: TZ, weekday: "short" }).toUpperCase()}
                    </p>
                    <p style={{ fontFamily: "var(--font-condensed)", fontSize: 20, color: today ? "var(--foto-paper)" : "var(--foto-ink)", margin: 0, lineHeight: 1.1 }}>
                      {s.date.toLocaleDateString("es-AR", { timeZone: TZ, day: "numeric" })}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: today ? "var(--foto-paper2)" : "var(--foto-accent)", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {s.date.toLocaleDateString("es-AR", { timeZone: TZ, month: "short" }).toUpperCase()}
                    </p>
                  </div>

                  {/* Client info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 600, color: "var(--foto-ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.client.name}
                    </p>
                    <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--foto-ink2)", margin: "2px 0 0" }}>
                      {TYPE_LABELS[s.type]}{s.eventName ? ` — ${s.eventName}` : ""}
                      {time ? ` · ${time}` : ""}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: today ? "var(--foto-ink)" : tomorrow ? "var(--rust)" : "var(--foto-accent)", margin: "4px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {fmtRelDate(s.date)}
                    </p>
                  </div>

                  {/* Price */}
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--foto-ink)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    {fmtMoney(s.price, s.currency)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── KPIs del mes ─────────────────────────────────────────── */}
      <section>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 600, color: "var(--foto-ink)", margin: "0 0 12px" }}>
          {mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
          {[
            { label: "Sesiones",    value: thisMes.length,    unit: "" },
            { label: "Revenue ARS", value: revenueMesARS || null, formatted: revenueMesARS > 0 ? fmtARS(revenueMesARS) : "—", unit: revenueMesARS > 0 ? " ARS" : "" },
            { label: "Revenue USD", value: revenueMesUSD || null, formatted: revenueMesUSD > 0 ? fmtUSD(revenueMesUSD) : "—", unit: revenueMesUSD > 0 ? " USD" : "" },
            { label: "Clientes",    value: clients.length,    unit: "" },
          ].map((k) => (
            <div key={k.label} style={{ padding: "14px 16px", background: "var(--foto-paper2)", border: "1px solid var(--foto-rule)" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>{k.label}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: "var(--foto-ink)", margin: "6px 0 0", fontVariantNumeric: "tabular-nums", fontWeight: 500, lineHeight: 1 }}>
                {"formatted" in k ? k.formatted : k.value}
                {"unit" in k && k.unit && <span style={{ fontSize: 10, color: "var(--foto-accent)", fontWeight: 400 }}>{k.unit}</span>}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Historial reciente ────────────────────────────────────── */}
      {recent.length > 0 && (
        <section>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 600, color: "var(--foto-ink)", margin: "0 0 12px" }}>
            Recientes
          </p>
          <div style={{ border: "1px solid var(--foto-rule)" }}>
            {recent.map((s, i) => (
              <Link key={s.id} href={`/fotografia/sesiones/${s.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < recent.length - 1 ? "1px solid var(--foto-rule)" : "none", textDecoration: "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: "var(--foto-ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.client.name}
                  </p>
                  <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--foto-ink2)", margin: "2px 0 0" }}>
                    {TYPE_LABELS[s.type]}{s.eventName ? ` — ${s.eventName}` : ""} · {s.date.toLocaleDateString("es-AR", { timeZone: TZ, day: "numeric", month: "short" })}
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {STATUS_LABELS[s.status]}
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--foto-ink)", margin: "3px 0 0", fontVariantNumeric: "tabular-nums" }}>
                    {fmtMoney(s.price, s.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
