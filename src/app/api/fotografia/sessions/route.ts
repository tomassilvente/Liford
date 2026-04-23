import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { createCalendarEvent } from "@/lib/google-calendar";

const TYPE_LABELS: Record<string, string> = { SPORT: "Deporte", EVENT: "Evento", OTHER: "Otro" };

export async function GET(request: NextRequest) {
  const authSession = await getApiSession();
  if (!authSession) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  const sessions = await db.session.findMany({
    where: {
      client: { userId: authSession.userId },
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { date: "asc" },
    include: { client: { select: { name: true, instagram: true } } },
  });
  return Response.json(sessions);
}

export async function POST(request: NextRequest) {
  const authSession = await getApiSession();
  if (!authSession) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();

  const client = await db.client.findUnique({
    where: { id: body.clientId, userId: authSession.userId },
  });
  if (!client) return Response.json({ error: "Cliente no encontrado" }, { status: 404 });

  const session = await db.session.create({
    data: {
      clientId: body.clientId,
      type: body.type,
      eventName: body.eventName ?? null,
      date: new Date(body.date),
      durationMinutes: body.durationMinutes ?? null,
      price: Number(body.price),
      currency: body.currency,
      notes: body.notes ?? null,
    },
    include: { client: true },
  });

  // Crear evento en Google Calendar (no bloquea si falla)
  const typeLabel = TYPE_LABELS[body.type] ?? body.type;
  const summary = body.eventName
    ? `${body.eventName} (${typeLabel})`
    : `${client.name} — ${typeLabel}`;
  const description = [
    body.notes,
    `Precio: ${Number(body.price)} ${body.currency}`,
    client.instagram ? `IG: @${client.instagram}` : null,
  ].filter(Boolean).join("\n");

  const googleCalendarId = await createCalendarEvent({
    summary,
    description,
    startISO: new Date(body.date).toISOString(),
    durationMinutes: body.durationMinutes ?? 120,
  });

  if (googleCalendarId) {
    await db.session.update({ where: { id: session.id }, data: { googleCalendarId } });
  }

  return Response.json({ ...session, googleCalendarId }, { status: 201 });
}
