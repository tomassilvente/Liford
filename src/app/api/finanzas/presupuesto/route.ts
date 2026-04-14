import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";

export async function GET() {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const budgets = await db.budget.findMany({
    where: { userId: session.userId },
    orderBy: { category: "asc" },
  });
  return Response.json(budgets);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { category, monthlyLimit, currency } = body;

  if (!category || !monthlyLimit) {
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const budget = await db.budget.upsert({
    where: {
      userId_category_currency: {
        userId: session.userId,
        category,
        currency: currency ?? "ARS",
      },
    },
    update: { monthlyLimit: Number(monthlyLimit) },
    create: {
      userId: session.userId,
      category,
      monthlyLimit: Number(monthlyLimit),
      currency: currency ?? "ARS",
    },
  });
  return Response.json(budget, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await request.json();
  await db.budget.delete({ where: { id, userId: session.userId } });
  return Response.json({ ok: true });
}
