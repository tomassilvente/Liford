import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const range = request.nextUrl.searchParams.get("range") ?? "1mo";

  const intervalMap: Record<string, string> = {
    "1w":  "1d",
    "1mo": "1d",
    "3mo": "1d",
    "6mo": "1wk",
    "1y":  "1wk",
  };
  const interval = intervalMap[range] ?? "1d";

  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    return Response.json({ error: `Yahoo Finance error: ${res.status}` }, { status: res.status });
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];

  if (!result) {
    return Response.json({ error: "Sin datos" }, { status: 404 });
  }

  const timestamps: number[] = result.timestamp ?? [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

  const data = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
      price: closes[i] ?? null,
    }))
    .filter((d) => d.price !== null);

  return Response.json({ ticker, range, data });
}
