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
  const { ticker, name, type, currency, quantity, avgBuyPrice } = body;

  if (!ticker || !type || !quantity || !avgBuyPrice) {
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const investCurrency: "ARS" | "USD" = currency === "ARS" ? "ARS" : "USD";
  let tickerUpper = ticker.trim().toUpperCase();
  // Acciones/CEDEARs en pesos cotizan en BYMA: sin el sufijo .BA, Yahoo devuelve la cotización en USD (NASDAQ/NYSE)
  if (type === "STOCK" && investCurrency === "ARS" && !tickerUpper.includes(".")) {
    tickerUpper = `${tickerUpper}.BA`;
  }

  const existing = await db.investment.findFirst({
    where: { ticker: tickerUpper, userId: session.userId, currency: investCurrency },
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
      ticker: tickerUpper,
      name: name ?? null,
      type,
      currency: investCurrency,
      quantity: Number(quantity),
      avgBuyPrice: Number(avgBuyPrice),
    },
  });

  return Response.json(inversion, { status: 201 });
}
