import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const wallets = await db.wallet.findMany({ orderBy: { createdAt: "asc" } });
  return Response.json(wallets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const wallet = await db.wallet.create({
    data: {
      name: body.name,
      currency: body.currency,
      balance: body.balance ?? 0,
    },
  });
  return Response.json(wallet, { status: 201 });
}
