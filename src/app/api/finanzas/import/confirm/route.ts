import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ImportedTransaction } from "@/lib/import-parser";

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { transactions } = await request.json() as { transactions: ImportedTransaction[] };
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return Response.json({ error: "No hay transacciones para importar" }, { status: 400 });
  }

  const created = await db.transaction.createMany({
    data: transactions.map((t) => ({
      userId: session.userId,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      category: t.category,
      description: t.description || null,
      source: t.source,
      date: new Date(t.date),
    })),
    skipDuplicates: false,
  });

  return Response.json({ imported: created.count });
}
