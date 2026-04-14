import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { username, password, displayName } = await request.json();

    if (!username || !password) {
      return Response.json({ error: "Usuario y contraseña son requeridos" }, { status: 400 });
    }

    if (username.length < 3) {
      return Response.json({ error: "El usuario debe tener al menos 3 caracteres" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return Response.json({ error: "Ese nombre de usuario ya está en uso" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        username,
        passwordHash,
        displayName: displayName?.trim() || username,
      },
    });

    await createSession({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    return Response.json({ ok: true, username: user.username }, { status: 201 });
  } catch (err) {
    console.error("[auth/register]", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
