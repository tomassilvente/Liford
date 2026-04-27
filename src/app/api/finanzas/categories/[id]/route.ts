import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const { name, icon, color, type, sortOrder } = body;

  const cat = await db.category.findFirst({ where: { id, userId } });
  if (!cat) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const updated = await db.category.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(type !== undefined && { type }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await requireSession();
  const { id } = await params;
  const cat = await db.category.findFirst({ where: { id, userId } });
  if (!cat) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  await db.category.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
