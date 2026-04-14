import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: "Credenciales requeridas" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { username } });
    if (!user) {
      return Response.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    return Response.json({ ok: true, username: user.username });
  } catch (err) {
    console.error("[auth/login]", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
