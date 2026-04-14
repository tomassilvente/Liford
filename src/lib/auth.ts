import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";

/**
 * For server components: returns the session or redirects to /login
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * For API routes: returns the session or null (caller handles 401)
 */
export async function getApiSession(): Promise<SessionPayload | null> {
  return getSession();
}
