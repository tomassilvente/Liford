import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getApiSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { email } = await request.json();
  const trimmed = email?.trim().toLowerCase();

  if (!trimmed) {
    return Response.json({ error: "Email requerido" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  const existing = await db.user.findFirst({
    where: { email: trimmed, NOT: { id: session.userId } },
  });
  if (existing) {
    return Response.json({ error: "Ese email ya está en uso" }, { status: 409 });
  }

  await db.user.update({ where: { id: session.userId }, data: { email: trimmed } });
  return Response.json({ ok: true });
}
