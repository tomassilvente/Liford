import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { TransactionType } from "@/generated/prisma/enums";
import { getApiSession } from "@/lib/auth";
import { parseDateToUTCNoon } from "@/lib/dates";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { description, category, date, amount } = body;

  const existing = await db.transaction.findUnique({ where: { id, userId: session.userId } });
  if (!existing) {
    return Response.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  const newAmount = amount !== undefined ? Number(amount) : null;
  const amountDiff = newAmount !== null ? newAmount - existing.amount : 0;

  if (amountDiff !== 0) {
    const wallet = await db.wallet.findFirst({
      where: { currency: existing.currency, userId: session.userId },
      orderBy: { createdAt: "asc" },
    });

    if (wallet) {
      await db.$transaction([
        db.transaction.update({
          where: { id },
          data: {
            ...(description && { description }),
            ...(category && { category }),
            ...(date && { date: parseDateToUTCNoon(date) }),
            amount: newAmount!,
          },
        }),
        db.wallet.update({
          where: { id: wallet.id },
          data: {
            balance:
              existing.type === TransactionType.EXPENSE
                ? { decrement: amountDiff }
                : { increment: amountDiff },
          },
        }),
      ]);
      return Response.json({ ok: true });
    }
  }

  const transaction = await db.transaction.update({
    where: { id },
    data: {
      ...(description && { description }),
      ...(category && { category }),
      ...(date && { date: parseDateToUTCNoon(date) }),
      ...(newAmount !== null && { amount: newAmount }),
    },
  });

  return Response.json(transaction);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const transaction = await db.transaction.findUnique({ where: { id, userId: session.userId } });
  if (!transaction) {
    return Response.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  const wallet = await db.wallet.findFirst({
    where: { currency: transaction.currency, userId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  if (wallet) {
    await db.$transaction([
      db.transaction.delete({ where: { id } }),
      db.wallet.update({
        where: { id: wallet.id },
        data: {
          balance:
            transaction.type === TransactionType.EXPENSE
              ? { increment: transaction.amount }
              : { decrement: transaction.amount },
        },
      }),
    ]);
  } else {
    await db.transaction.delete({ where: { id } });
  }

  return Response.json({ ok: true });
}
