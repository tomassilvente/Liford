import { cookies } from "next/headers";
import { encryptToken, decryptToken, SESSION_COOKIE, SESSION_DURATION_DAYS } from "@/lib/jwt";
import type { SessionPayload } from "@/lib/jwt";

export type { SessionPayload };

export async function createSession(user: SessionPayload) {
  const token = await encryptToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decryptToken(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
