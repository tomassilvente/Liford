import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { fetchMPTransactions } from "@/lib/mercadopago";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");

  try {
    const transactions = await fetchMPTransactions(days);

    // Detectar posibles duplicados contra transacciones ya guardadas
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const existing = await db.transaction.findMany({
      where: { userId: session.userId, date: { gte: dateFrom } },
      select: { amount: true, currency: true, type: true, date: true },
    });

    const withDupes = transactions.map((t) => {
      const possibleDuplicate = existing.some(
        (e) =>
          Math.abs(e.amount - t.amount) < 1 &&
          e.currency === t.currency &&
          e.type === t.type &&
          e.date.toISOString().slice(0, 10) === t.date
      );
      return { ...t, possibleDuplicate };
    });

    return Response.json({ transactions: withDupes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Mercado Pago";
    console.error("[MP]", msg);
    return Response.json({ error: msg }, { status: 502 });
  }
}
