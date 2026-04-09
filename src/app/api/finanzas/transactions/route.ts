import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const source = searchParams.get("source");
  const month = searchParams.get("month"); // YYYY-MM

  const where: Record<string, unknown> = {};
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
  const body = await request.json();
  const transaction = await db.transaction.create({
    data: {
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
