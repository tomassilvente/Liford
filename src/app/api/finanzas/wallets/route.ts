import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";

export async function GET() {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const wallets = await db.wallet.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "asc" } });
  return Response.json(wallets);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const wallet = await db.wallet.create({
    data: {
      userId: session.userId,
      name: body.name,
      currency: body.currency,
      balance: Number(body.balance ?? 0),
    },
  });
  return Response.json(wallet, { status: 201 });
}
