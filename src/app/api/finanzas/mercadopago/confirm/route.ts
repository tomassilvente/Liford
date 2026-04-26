import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { TransactionType, TransactionSource } from "@/generated/prisma/enums";

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { transactions, walletId } = body as {
    transactions: {
      date: string;
      type: "EXPENSE" | "INCOME";
      amount: number;
      currency: "ARS" | "USD";
      category: string;
      description: string;
      source: "PERSONAL";
    }[];
    walletId: string | null;
  };

  if (!transactions?.length) return Response.json({ error: "Sin transacciones" }, { status: 400 });

  // Verificar que la billetera pertenece al usuario
  const wallet = walletId
    ? await db.wallet.findUnique({ where: { id: walletId, userId: session.userId } })
    : null;

  if (walletId && !wallet) {
    return Response.json({ error: "Billetera no encontrada" }, { status: 404 });
  }

  // Calcular variación neta en la moneda de la billetera
  let netChange = 0;
  if (wallet) {
    for (const t of transactions) {
      if (t.currency !== wallet.currency) continue;
      netChange += t.type === "INCOME" ? t.amount : -t.amount;
    }
  }

  // Insertar transacciones + actualizar saldo en una sola operación atómica
  await db.$transaction([
    db.transaction.createMany({
      data: transactions.map((t) => ({
        userId: session.userId,
        type: t.type === "EXPENSE" ? TransactionType.EXPENSE : TransactionType.INCOME,
        source: TransactionSource.PERSONAL,
        amount: t.amount,
        currency: t.currency,
        category: t.category,
        description: t.description,
        date: new Date(t.date),
      })),
      skipDuplicates: true,
    }),
    ...(wallet && netChange !== 0
      ? [db.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: netChange } },
        })]
      : []),
  ]);

  return Response.json({ imported: transactions.length, netChange, walletName: wallet?.name ?? null });
}
