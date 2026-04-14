import { NextRequest } from "next/server";
import { getApiSession } from "@/lib/auth";
import { parseExcel, parseJSON, parseMmbackup } from "@/lib/import-parser";

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No se recibió ningún archivo" }, { status: 400 });

  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  try {
    let transactions;
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      transactions = parseExcel(buffer);
    } else if (name.endsWith(".json")) {
      const text = new TextDecoder().decode(buffer);
      transactions = parseJSON(text);
    } else if (name.endsWith(".mmbackup")) {
      transactions = parseMmbackup(buffer);
    } else {
      return Response.json({ error: "Formato no soportado. Usá .xlsx, .json o .mmbackup" }, { status: 400 });
    }

    return Response.json({ transactions, total: transactions.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al parsear el archivo";
    return Response.json({ error: msg }, { status: 422 });
  }
}
