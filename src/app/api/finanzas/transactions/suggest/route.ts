import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { suggestFromDescription } from "@/lib/inference/suggest-from-description";

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const type = (searchParams.get("type") ?? "EXPENSE") as "EXPENSE" | "INCOME";

  const suggestion = await suggestFromDescription(session.userId, q, type);
  return Response.json(suggestion ?? null);
}
