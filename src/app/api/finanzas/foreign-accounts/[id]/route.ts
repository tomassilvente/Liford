import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const account = await db.foreignAccount.update({
    where: { id, userId: session.userId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.balance !== undefined && { balance: Number(body.balance) }),
    },
  });
  return Response.json(account);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  await db.foreignAccount.delete({ where: { id, userId: session.userId } });
  return new Response(null, { status: 204 });
}
