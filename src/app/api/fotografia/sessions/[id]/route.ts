import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";

const TYPE_LABELS: Record<string, string> = { SPORT: "Deporte", EVENT: "Evento", OTHER: "Otro" };

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getApiSession();
  if (!authSession) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await db.session.findUnique({
    where: { id },
    include: {
      client: { select: { userId: true, name: true } },
      _count: { select: { transactions: true } },
    },
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

  // ── Auto-registrar ingreso en finanzas al marcar como PAID ────────────────
  const becomingPaid = body.status === "PAID" && existing.status !== "PAID";
  const noTransactionYet = existing._count.transactions === 0;

  if (becomingPaid && noTransactionYet) {
    const price = body.price !== undefined ? Number(body.price) : existing.price;
    const currency = body.currency ?? existing.currency;
    const typeLabel = TYPE_LABELS[existing.type] ?? existing.type;
    const description = existing.eventName
      ? `${existing.eventName} (${typeLabel})`
      : `${existing.client.name} — ${typeLabel}`;

    await db.transaction.create({
      data: {
        userId: authSession.userId,
        type: TransactionType.INCOME,
        source: TransactionSource.PHOTOGRAPHY,
        amount: price,
        currency,
        category: "Fotografía",
        description,
        date: existing.date,
        sessionId: id,
      },
    });
  }

  // ── Actualizar Google Calendar si cambió fecha o duración ─────────────────
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

  // Eliminar transacciones vinculadas antes de borrar la sesión
  await db.transaction.deleteMany({ where: { sessionId: id } });
  await db.session.delete({ where: { id } });

  if (existing.googleCalendarId) {
    await deleteCalendarEvent(existing.googleCalendarId);
  }

  return new Response(null, { status: 204 });
}
