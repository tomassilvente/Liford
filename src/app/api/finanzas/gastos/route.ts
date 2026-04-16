import { db } from "@/lib/db";
import { TransactionSource, TransactionType } from "@/generated/prisma/enums";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { description, amount, category, walletId, foreignAccountId, date } = body;

  if (!description || !amount || !category || (!walletId && !foreignAccountId)) {
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  // ── Billetera ARS/USD ──────────────────────────────────────────────────────
  if (walletId) {
    const wallet = await db.wallet.findUnique({ where: { id: walletId, userId: session.userId } });
    if (!wallet) return Response.json({ error: "Billetera no encontrada" }, { status: 404 });

    const [transaction] = await db.$transaction([
      db.transaction.create({
        data: {
          userId: session.userId,
          type: TransactionType.EXPENSE,
          source: TransactionSource.PERSONAL,
          amount: Number(amount),
          currency: wallet.currency,
          category,
          description,
          date: date ? new Date(date) : new Date(),
        },
      }),
      db.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: Number(amount) } },
      }),
    ]);

    return Response.json(transaction, { status: 201 });
  }

  // ── Cuenta foránea ─────────────────────────────────────────────────────────
  const account = await db.foreignAccount.findUnique({ where: { id: foreignAccountId, userId: session.userId } });
  if (!account) return Response.json({ error: "Cuenta no encontrada" }, { status: 404 });

  const [transaction] = await db.$transaction([
    db.transaction.create({
      data: {
        userId: session.userId,
        type: TransactionType.EXPENSE,
        source: TransactionSource.PERSONAL,
        amount: Number(amount),
        currency: account.currency,
        category,
        description,
        date: date ? new Date(date) : new Date(),
      },
    }),
    db.foreignAccount.update({
      where: { id: foreignAccountId },
      data: { balance: { decrement: Number(amount) } },
    }),
  ]);

  return Response.json(transaction, { status: 201 });
}
