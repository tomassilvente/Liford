import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { getThumbnailStream } from "@/lib/google-drive";

export async function GET(_: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const authSession = await getApiSession();
  if (!authSession) return new Response("No autenticado", { status: 401 });

  const { fileId } = await params;
  const result = await getThumbnailStream(fileId);

  if (!result) return new Response("Thumbnail no disponible", { status: 404 });

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
