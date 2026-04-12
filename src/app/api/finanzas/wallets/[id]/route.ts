import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const wallet = await db.wallet.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.balance !== undefined && { balance: Number(body.balance) }),
    },
  });

  return Response.json(wallet);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.wallet.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
