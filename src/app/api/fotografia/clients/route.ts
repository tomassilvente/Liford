import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";

export async function GET() {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const clients = await db.client.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { sessions: true } } },
  });
  return Response.json(clients);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const client = await db.client.create({
    data: {
      userId: session.userId,
      name: body.name,
      instagram: body.instagram ?? null,
      phone: body.phone ?? null,
      notes: body.notes ?? null,
    },
  });
  return Response.json(client, { status: 201 });
}
