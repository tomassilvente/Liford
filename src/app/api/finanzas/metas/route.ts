import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });
  const goals = await db.savingsGoal.findMany({
    where: { userId: session.userId },
    include: { wallet: true, foreignAccount: true },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(goals);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });
  const body = await request.json();
  const goal = await db.savingsGoal.create({
    data: {
      userId: session.userId,
      name: body.name,
      targetAmount: Number(body.targetAmount),
      currency: body.currency ?? "USD",
      notes: body.notes ?? null,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      walletId: body.walletId ?? null,
      foreignAccountId: body.foreignAccountId ?? null,
    },
    include: { wallet: true, foreignAccount: true },
  });
  return Response.json(goal, { status: 201 });
}
