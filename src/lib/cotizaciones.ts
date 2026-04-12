export interface Cotizacion {
  ticker: string;
  price: number | null;
  currency: string | null;
  // Variación diaria
  changeAmount: number | null;   // +/- en USD
  changePct: number | null;      // +/- en %
  // Rango del día
  dayHigh: number | null;
  dayLow: number | null;
  // Referencia
  previousClose: number | null;
  // 52 semanas
  week52High: number | null;
  week52Low: number | null;
  // Info del mercado
  exchangeName: string | null;
  marketState: string | null;    // REGULAR, PRE, POST, CLOSED
  error?: string;
}

export async function fetchCotizaciones(tickers: string[]): Promise<Record<string, Cotizacion>> {
  if (tickers.length === 0) return {};

  const results: Record<string, Cotizacion> = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
          {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 300 }, // cache 5 minutos
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;

        results[ticker] = {
          ticker,
          price: meta?.regularMarketPrice ?? null,
          currency: meta?.currency ?? null,
          changeAmount: meta?.regularMarketChange ?? null,
          changePct: meta?.regularMarketChangePercent ?? null,
          dayHigh: meta?.regularMarketDayHigh ?? null,
          dayLow: meta?.regularMarketDayLow ?? null,
          previousClose: meta?.regularMarketPreviousClose ?? null,
          week52High: meta?.fiftyTwoWeekHigh ?? null,
          week52Low: meta?.fiftyTwoWeekLow ?? null,
          exchangeName: meta?.exchangeName ?? null,
          marketState: meta?.marketState ?? null,
        };
      } catch (e) {
        results[ticker] = {
          ticker,
          price: null,
          currency: null,
          changeAmount: null,
          changePct: null,
          dayHigh: null,
          dayLow: null,
          previousClose: null,
          week52High: null,
          week52Low: null,
          exchangeName: null,
          marketState: null,
          error: e instanceof Error ? e.message : "Error desconocido",
        };
      }
    })
  );

  return results;
}
