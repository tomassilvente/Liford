import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function POST() {
  const { userId } = await requireSession();
  await db.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  });
  return new NextResponse(null, { status: 204 });
}
