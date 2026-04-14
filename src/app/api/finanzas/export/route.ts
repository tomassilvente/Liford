import { getApiSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getApiSession();
  if (!session) return Response.json({ error: "No autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx") as typeof import("xlsx");

  const transactions = await db.transaction.findMany({
    where: { userId: session.userId },
    orderBy: { date: "desc" },
  });

  const rows = transactions.map((t) => ({
    Fecha: t.date.toISOString().slice(0, 10),
    Tipo: t.type === "EXPENSE" ? "Gasto" : t.type === "INCOME" ? "Ingreso" : t.type,
    Categoría: t.category,
    Descripción: t.description ?? "",
    Monto: t.amount,
    Moneda: t.currency,
    Fuente: t.source === "PERSONAL" ? "Personal" : "Fotografía",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, // Fecha
    { wch: 10 }, // Tipo
    { wch: 20 }, // Categoría
    { wch: 30 }, // Descripción
    { wch: 14 }, // Monto
    { wch: 8 },  // Moneda
    { wch: 12 }, // Fuente
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transacciones");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as number[];
  const uint8 = new Uint8Array(buf);

  const filename = `liford_transacciones_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(uint8.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
