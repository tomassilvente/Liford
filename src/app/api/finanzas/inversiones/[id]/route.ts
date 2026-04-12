import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const inversion = await db.investment.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.quantity !== undefined && { quantity: Number(body.quantity) }),
      ...(body.avgBuyPrice !== undefined && { avgBuyPrice: Number(body.avgBuyPrice) }),
    },
  });

  return Response.json(inversion);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.investment.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
