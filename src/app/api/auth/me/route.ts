import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  return Response.json({ userId: session.userId, username: session.username, displayName: session.displayName });
}
