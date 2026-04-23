import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getApiSession();
  if (!authSession) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await db.session.findUnique({
    where: { id },
    include: { client: { select: { userId: true, name: true } } },
  });
  if (!existing || existing.client.userId !== authSession.userId) {
    return Response.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  const session = await db.session.update({
    where: { id },
    data: {
      ...(body.type !== undefined && { type: body.type }),
      ...(body.eventName !== undefined && { eventName: body.eventName }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.durationMinutes !== undefined && { durationMinutes: body.durationMinutes }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.photosDelivered !== undefined && { photosDelivered: body.photosDelivered }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.driveUrl !== undefined && { driveUrl: body.driveUrl }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: { client: { select: { name: true, instagram: true } } },
  });

  // Actualizar evento en Google Calendar si cambiaron fecha o duración
  if (existing.googleCalendarId && (body.date !== undefined || body.durationMinutes !== undefined)) {
    const newDate = body.date ? new Date(body.date) : existing.date;
    const newDuration = body.durationMinutes ?? existing.durationMinutes ?? 120;
    await updateCalendarEvent(existing.googleCalendarId, {
      startISO: newDate.toISOString(),
      durationMinutes: newDuration,
    });
  }

  return Response.json(session);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getApiSession();
  if (!authSession) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const existing = await db.session.findUnique({
    where: { id },
    include: { client: { select: { userId: true } } },
  });
  if (!existing || existing.client.userId !== authSession.userId) {
    return Response.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  await db.session.delete({ where: { id } });

  if (existing.googleCalendarId) {
    await deleteCalendarEvent(existing.googleCalendarId);
  }

  return new Response(null, { status: 204 });
}
