import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const { userId } = await requireSession();
  const cats = await db.category.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { children: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  const { userId } = await requireSession();
  const body = await req.json();
  const { name, icon, color, type = "EXPENSE", parentId, sortOrder = 0 } = body;

  if (!name) return NextResponse.json({ error: "name requerido" }, { status: 400 });

  try {
    const cat = await db.category.create({
      data: { userId, name, icon: icon ?? null, color: color ?? null, type, parentId: parentId ?? null, sortOrder },
    });
    return NextResponse.json(cat, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
  }
}
