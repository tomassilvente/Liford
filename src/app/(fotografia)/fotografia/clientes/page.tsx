export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import ClientForm from "@/components/fotografia/ClientForm";
import ClientRow from "@/components/fotografia/ClientRow";

export default async function ClientesPage() {
  const { userId } = await requireSession();

  const clients = await db.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { sessions: true } } },
  });

  return (
    <div>
      <header style={{ borderTop: "4px solid var(--foto-ink)", paddingTop: 14, marginBottom: 24 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--foto-accent)", margin: 0, textTransform: "uppercase" }}>II · Clientes</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 }}>
          <h1 style={{ fontFamily: "var(--font-condensed)", fontSize: 48, color: "var(--foto-ink)", margin: 0, lineHeight: 0.9, letterSpacing: "0.02em", textTransform: "uppercase" }}>
            Cartera
          </h1>
          <ClientForm />
        </div>
      </header>

      {clients.length === 0 ? (
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 14, color: "var(--foto-rule)" }}>No hay clientes todavía.</p>
      ) : (
        <div style={{ border: "1px solid var(--foto-rule)" }}>
          {clients.map((c) => (
            <ClientRow
              key={c.id}
              id={c.id}
              name={c.name}
              instagram={c.instagram}
              phone={c.phone}
              notes={c.notes}
              sessionCount={c._count.sessions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
