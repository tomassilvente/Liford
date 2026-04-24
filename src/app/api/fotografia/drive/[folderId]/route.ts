import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { listPhotosInFolder } from "@/lib/google-drive";

export async function GET(_: NextRequest, { params }: { params: Promise<{ folderId: string }> }) {
  const authSession = await getApiSession();
  if (!authSession) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { folderId } = await params;
  const photos = await listPhotosInFolder(folderId);
  return Response.json(photos);
}
