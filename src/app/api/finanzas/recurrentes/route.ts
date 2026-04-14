import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const items = await db.recurringExpense.findMany({
    where: { userId: session.userId },
    orderBy: { dayOfMonth: "asc" },
  });
  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const item = await db.recurringExpense.create({
    data: {
      userId: session.userId,
      transactionType: body.transactionType ?? "EXPENSE",
      description: body.description,
      amount: Number(body.amount),
      currency: body.currency ?? "ARS",
      category: body.category,
      source: body.source ?? "PERSONAL",
      dayOfMonth: Number(body.dayOfMonth),
      isActive: true,
      walletId: body.walletId ?? null,
      foreignAccountId: body.foreignAccountId ?? null,
    },
  });
  return Response.json(item, { status: 201 });
}
