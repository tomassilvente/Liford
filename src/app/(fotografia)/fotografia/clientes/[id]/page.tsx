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
    ? new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)
    : new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(n);
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmada", SHOT: "Disparada",
  DELIVERED: "Entregada", PAID: "Pagada", COMPLETED: "Completada",
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

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === "COMPLETED" || s.status === "PAID").length;

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

  const nextSession = sessions.find((s) => new Date(s.date) > now && s.status !== "COMPLETED" && s.status !== "PAID");
  const pendingPayment = sessions.filter((s) => s.status === "DELIVERED").length;

  const phone = client.phone?.replace(/\D/g, "");
  const whatsappUrl = phone ? `https://wa.me/${phone.startsWith("54") ? phone : `54${phone}`}` : null;
  const clientSince = new Date(client.createdAt).toLocaleDateString("es-AR", { month: "short", year: "numeric" });
  const initials = client.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <div>
      {/* Back */}
      <Link href="/fotografia/clientes" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
        <LuArrowLeft size={12} /> Clientes
      </Link>

      {/* Header */}
      <div style={{ borderTop: "4px solid var(--foto-ink)", paddingTop: 14, marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {/* Initials stamp — replaces gradient avatar */}
            <div style={{
              width: 52, height: 52, flexShrink: 0,
              border: "2px solid var(--foto-ink)", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-condensed)", fontSize: 20, letterSpacing: "0.04em",
              color: "var(--foto-ink)", textTransform: "uppercase",
            }}>
              {initials}
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-condensed)", fontSize: 36, color: "var(--foto-ink)", margin: 0, lineHeight: 0.95, letterSpacing: "0.02em", textTransform: "uppercase" }}>{client.name}</h1>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 8 }}>
                {client.instagram && (
                  <a href={`https://instagram.com/${client.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", textDecoration: "none", letterSpacing: "0.06em" }}>
                    <LuInstagram size={12} /> {client.instagram}
                  </a>
                )}
                {client.phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", letterSpacing: "0.06em" }}>
                    <LuPhone size={12} /> {client.phone}
                  </span>
                )}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-rule)", letterSpacing: "0.08em" }}>Cliente desde {clientSince}</span>
              </div>
              {client.notes && <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--foto-ink2)", margin: "6px 0 0", lineHeight: 1.4 }}>{client.notes}</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--olive)", color: "var(--foto-paper)", border: "none", padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", cursor: "pointer" }}>
                <LuMessageCircle size={13} /> WA
              </a>
            )}
            <Link href="/fotografia/sesiones" style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--foto-ink)", color: "var(--foto-paper)", border: "none", padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
              <LuCalendarPlus size={13} /> + Sesión
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ borderTop: "2px solid var(--foto-ink)", paddingTop: 10 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>Sesiones</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--foto-ink)", margin: "4px 0 0", fontVariantNumeric: "tabular-nums" }}>{totalSessions}</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", margin: "2px 0 0" }}>{completedSessions} completadas</p>
        </div>
        {ltvARS > 0 && (
          <div style={{ borderTop: "2px solid var(--foto-ink)", paddingTop: 10 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>LTV ARS</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--foto-ink)", margin: "4px 0 0", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtPrice(ltvARS, "ARS")}</p>
            {avgARS > 0 && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", margin: "2px 0 0" }}>Prom. {fmtPrice(avgARS, "ARS")}</p>}
          </div>
        )}
        {ltvUSD > 0 && (
          <div style={{ borderTop: "2px solid var(--foto-ink)", paddingTop: 10 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>LTV USD</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--foto-ink)", margin: "4px 0 0", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtPrice(ltvUSD, "USD")}</p>
            {avgUSD > 0 && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", margin: "2px 0 0" }}>Prom. {fmtPrice(avgUSD, "USD")}</p>}
          </div>
        )}
        {pendingPayment > 0 && (
          <div style={{ borderTop: `2px solid var(--olive)`, paddingTop: 10 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>Por cobrar</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--olive)", margin: "4px 0 0", fontVariantNumeric: "tabular-nums" }}>{pendingPayment}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--olive)", margin: "2px 0 0" }}>sesión{pendingPayment !== 1 ? "es" : ""} disparada{pendingPayment !== 1 ? "s" : ""}</p>
          </div>
        )}
      </div>

      {/* Próxima sesión */}
      {nextSession && (
        <div style={{ padding: "12px 14px", borderLeft: "3px solid var(--navy)", background: "var(--foto-paper2)", marginBottom: 24 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--navy)", margin: "0 0 6px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Próxima sesión</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "var(--font-condensed)", fontSize: 16, color: "var(--foto-ink)", margin: 0, letterSpacing: "0.02em", textTransform: "uppercase" }}>{fmtDate(nextSession.date.toISOString())}</p>
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--foto-ink2)", margin: "2px 0 0" }}>
                {nextSession.type === "SPORT" ? "Deporte" : nextSession.type === "EVENT" ? "Evento" : "Otro"}
                {nextSession.eventName ? ` — ${nextSession.eventName}` : ""}
                {" · "}{fmtPrice(nextSession.price, nextSession.currency)} {nextSession.currency}
              </p>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", border: "1px solid var(--foto-accent)", padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {STATUS_LABELS[nextSession.status]}
            </span>
          </div>
        </div>
      )}

      {/* Historial */}
      <div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: "0 0 12px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Historial de sesiones</p>
        {sessions.length === 0 ? (
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--foto-rule)" }}>Sin sesiones todavía.</p>
        ) : (
          <div style={{ border: "1px solid var(--foto-rule)" }}>
            {sessions.map((s, i) => (
              <Link
                key={s.id}
                href={`/fotografia/sesiones/${s.id}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: i < sessions.length - 1 ? "1px dashed var(--foto-rule)" : "none", textDecoration: "none" }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-condensed)", fontSize: 15, color: "var(--foto-ink)", margin: 0, letterSpacing: "0.02em", textTransform: "uppercase" }}>{fmtDate(s.date.toISOString())}</p>
                  <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--foto-ink2)", margin: "2px 0 0" }}>
                    {s.type === "SPORT" ? "Deporte" : s.type === "EVENT" ? "Evento" : "Otro"}
                    {s.eventName ? ` — ${s.eventName}` : ""}
                    {s.photosDelivered ? ` · ${s.photosDelivered} fotos` : ""}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", border: "1px solid var(--foto-rule)", padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {STATUS_LABELS[s.status]}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--foto-ink)", fontVariantNumeric: "tabular-nums" }}>
                    {fmtPrice(s.price, s.currency)} <span style={{ fontSize: 9, color: "var(--foto-accent)" }}>{s.currency}</span>
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
