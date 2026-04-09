import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  const sessions = await db.session.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { date: "asc" },
    include: { client: { select: { name: true, instagram: true } } },
  });
  return Response.json(sessions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
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
