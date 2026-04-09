import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const clients = await db.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { sessions: true } } },
  });
  return Response.json(clients);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = await db.client.create({
    data: {
      name: body.name,
      instagram: body.instagram ?? null,
      phone: body.phone ?? null,
      notes: body.notes ?? null,
    },
  });
  return Response.json(client, { status: 201 });
}
