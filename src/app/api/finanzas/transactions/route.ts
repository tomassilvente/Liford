import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const source = searchParams.get("source");
  const month = searchParams.get("month"); // YYYY-MM

  const where: Record<string, unknown> = { userId: session.userId };
  if (source) where.source = source;
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.date = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    };
  }

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { session: { select: { eventName: true, type: true } } },
  });
  return Response.json(transactions);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const transaction = await db.transaction.create({
    data: {
      userId: session.userId,
      type: body.type,
      amount: body.amount,
      currency: body.currency,
      category: body.category,
      description: body.description,
      source: body.source,
      date: new Date(body.date),
      sessionId: body.sessionId ?? null,
    },
  });
  return Response.json(transaction, { status: 201 });
}
