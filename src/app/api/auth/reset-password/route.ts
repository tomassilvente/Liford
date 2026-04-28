import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return Response.json({ error: "El link es inválido o ya fue usado" }, { status: 400 });
  }

  if (resetToken.expiresAt < new Date()) {
    await db.passwordResetToken.delete({ where: { token } });
    return Response.json({ error: "El link expiró. Solicitá uno nuevo" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    db.passwordResetToken.delete({ where: { token } }),
  ]);

  return Response.json({ ok: true });
}
