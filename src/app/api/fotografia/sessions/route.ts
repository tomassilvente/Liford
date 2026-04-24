import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { createCalendarEvent } from "@/lib/google-calendar";
import { createSessionFolder } from "@/lib/google-drive";

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

  const sessionDate = new Date(body.date);

  const session = await db.session.create({
    data: {
      clientId: body.clientId,
      type: body.type,
      eventName: body.eventName ?? null,
      date: sessionDate,
      durationMinutes: body.durationMinutes ?? null,
      price: Number(body.price),
      currency: body.currency,
      notes: body.notes ?? null,
    },
    include: { client: true },
  });

  // Crear carpeta en Drive y evento en Calendar en paralelo
  const typeLabel = TYPE_LABELS[body.type] ?? body.type;
  const summary = body.eventName
    ? `${body.eventName} (${typeLabel})`
    : `${client.name} — ${typeLabel}`;
  const calDescription = [
    body.notes,
    `Precio: ${Number(body.price)} ${body.currency}`,
    client.instagram ? `IG: @${client.instagram}` : null,
  ].filter(Boolean).join("\n");

  const [driveFolder, googleCalendarId] = await Promise.all([
    createSessionFolder({
      clientName: client.name,
      type: body.type,
      eventName: body.eventName ?? null,
      date: sessionDate,
    }),
    createCalendarEvent({
      summary,
      description: calDescription,
      startISO: sessionDate.toISOString(),
      durationMinutes: body.durationMinutes ?? 120,
    }),
  ]);

  // Guardar IDs de Drive y Calendar si se crearon
  if (driveFolder || googleCalendarId) {
    await db.session.update({
      where: { id: session.id },
      data: {
        ...(driveFolder && { driveUrl: driveFolder.url }),
        ...(googleCalendarId && { googleCalendarId }),
      },
    });
  }

  return Response.json(
    { ...session, driveUrl: driveFolder?.url ?? null, googleCalendarId },
    { status: 201 }
  );
}
