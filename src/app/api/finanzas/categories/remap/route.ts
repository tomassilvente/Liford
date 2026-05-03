import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { from, to } = await request.json();
  if (!from || !to) return Response.json({ error: "from y to son requeridos" }, { status: 400 });
  if (from === to) return Response.json({ updated: 0 });

  const [txResult, budgetResult] = await Promise.all([
    db.transaction.updateMany({
      where: { userId: session.userId, category: from },
      data: { category: to },
    }),
    db.budget.updateMany({
      where: { userId: session.userId, category: from },
      data: { category: to },
    }),
  ]);

  return Response.json({ updated: txResult.count + budgetResult.count });
}
