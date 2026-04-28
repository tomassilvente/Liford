import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const rule = await db.recurringExpense.findUnique({ where: { id } });
  if (!rule || rule.userId !== session.userId)
    return Response.json({ error: "No encontrado" }, { status: 404 });

  return Response.json(rule);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await db.recurringExpense.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId)
    return Response.json({ error: "No encontrado" }, { status: 404 });

  const updated = await db.recurringExpense.update({
    where: { id },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: Number(body.amount) }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.dayOfMonth !== undefined && { dayOfMonth: Number(body.dayOfMonth) }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.transactionType !== undefined && { transactionType: body.transactionType }),
      ...("walletId" in body && { walletId: body.walletId }),
      ...("foreignAccountId" in body && { foreignAccountId: body.foreignAccountId }),
      ...(body.lastApplied !== undefined && { lastApplied: new Date(body.lastApplied) }),
    },
  });
  return Response.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const existing = await db.recurringExpense.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId)
    return Response.json({ error: "No encontrado" }, { status: 404 });

  await db.recurringExpense.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
