import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getApiSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return Response.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return Response.json({ error: "Usuario no encontrado" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return Response.json({ error: "Contraseña actual incorrecta" }, { status: 401 });

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: session.userId }, data: { passwordHash: newHash } });

  return Response.json({ ok: true });
}
