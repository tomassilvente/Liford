import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const { username } = await request.json();
  if (!username?.trim()) {
    return Response.json({ error: "Ingresá tu usuario" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { username: username.trim() } });

  // Responder siempre igual para no revelar si el usuario existe
  if (!user || !user.email) {
    return Response.json({ ok: true });
  }

  // Eliminar tokens anteriores del usuario
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Crear token con 1 hora de expiración
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const { token } = await db.passwordResetToken.create({
    data: { userId: user.id, expiresAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password/${token}`;

  await sendPasswordResetEmail(user.email, user.displayName ?? user.username, resetUrl);

  return Response.json({ ok: true });
}
