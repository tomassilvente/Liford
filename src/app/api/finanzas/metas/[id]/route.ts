import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const existing = await db.savingsGoal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId)
    return Response.json({ error: "No encontrado" }, { status: 404 });
  const updated = await db.savingsGoal.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.targetAmount !== undefined && { targetAmount: Number(body.targetAmount) }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.targetDate !== undefined && { targetDate: body.targetDate ? new Date(body.targetDate) : null }),
      ...(body.isAchieved !== undefined && { isAchieved: body.isAchieved }),
      ...("walletId" in body && { walletId: body.walletId }),
      ...("foreignAccountId" in body && { foreignAccountId: body.foreignAccountId }),
    },
    include: { wallet: true, foreignAccount: true },
  });
  return Response.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const existing = await db.savingsGoal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId)
    return Response.json({ error: "No encontrado" }, { status: 404 });
  await db.savingsGoal.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
