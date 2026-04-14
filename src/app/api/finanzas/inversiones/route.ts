import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";

export async function GET() {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const inversiones = await db.investment.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "asc" } });
  return Response.json(inversiones);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { ticker, name, type, quantity, avgBuyPrice } = body;

  if (!ticker || !type || !quantity || !avgBuyPrice) {
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const existing = await db.investment.findFirst({
    where: { ticker: ticker.toUpperCase(), userId: session.userId },
  });

  if (existing) {
    const totalQty = existing.quantity + Number(quantity);
    const newAvg =
      (existing.quantity * existing.avgBuyPrice + Number(quantity) * Number(avgBuyPrice)) / totalQty;

    const updated = await db.investment.update({
      where: { id: existing.id },
      data: { quantity: totalQty, avgBuyPrice: newAvg },
    });
    return Response.json(updated);
  }

  const inversion = await db.investment.create({
    data: {
      userId: session.userId,
      ticker: ticker.toUpperCase(),
      name: name ?? null,
      type,
      quantity: Number(quantity),
      avgBuyPrice: Number(avgBuyPrice),
    },
  });

  return Response.json(inversion, { status: 201 });
}
