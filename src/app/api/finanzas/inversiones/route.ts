import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const inversiones = await db.investment.findMany({ orderBy: { createdAt: "asc" } });
  return Response.json(inversiones);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ticker, name, type, quantity, avgBuyPrice } = body;

  if (!ticker || !type || !quantity || !avgBuyPrice) {
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  // Si ya existe ese ticker, actualiza cantidad y precio promedio ponderado
  const existing = await db.investment.findFirst({ where: { ticker: ticker.toUpperCase() } });

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
      ticker: ticker.toUpperCase(),
      name: name ?? null,
      type,
      quantity: Number(quantity),
      avgBuyPrice: Number(avgBuyPrice),
    },
  });

  return Response.json(inversion, { status: 201 });
}
