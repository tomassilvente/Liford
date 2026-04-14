import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";

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

  // Verify client belongs to this user
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
      price: body.price,
      currency: body.currency,
      notes: body.notes ?? null,
    },
    include: { client: true },
  });
  return Response.json(session, { status: 201 });
}
