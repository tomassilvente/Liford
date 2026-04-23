import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getApiSession();
  if (!authSession) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await db.client.findUnique({ where: { id, userId: authSession.userId } });
  if (!existing) return Response.json({ error: "Cliente no encontrado" }, { status: 404 });

  const client = await db.client.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.instagram !== undefined && { instagram: body.instagram || null }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
    },
  });

  return Response.json(client);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getApiSession();
  if (!authSession) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const existing = await db.client.findUnique({ where: { id, userId: authSession.userId } });
  if (!existing) return Response.json({ error: "Cliente no encontrado" }, { status: 404 });

  await db.client.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
