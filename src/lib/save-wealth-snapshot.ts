import { db } from "@/lib/db";
import { fetchCotizaciones } from "@/lib/cotizaciones";

export async function saveWealthSnapshotIfNeeded(userId: string): Promise<void> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Only run once per month
  const existing = await db.wealthSnapshot.findUnique({
    where: { userId_date: { userId, date: thisMonthStart } },
  });
  if (existing) return;

  const [wallets, foreignAccounts, investments] = await Promise.all([
    db.wallet.findMany({ where: { userId } }),
    db.foreignAccount.findMany({ where: { userId } }),
    db.investment.findMany({ where: { userId } }),
  ]);

  const tickers = investments.map((i) => i.ticker);
  const cotizaciones = tickers.length > 0 ? await fetchCotizaciones(tickers) : {};

  const walletsARS = wallets
    .filter((w) => w.currency === "ARS")
    .reduce((s, w) => s + w.balance, 0);

  const foreignUSD = foreignAccounts.reduce((s, a) => s + a.balance, 0);

  const portfolioUSD = investments.reduce((sum, inv) => {
    const price = cotizaciones[inv.ticker]?.price ?? inv.avgBuyPrice;
    return sum + inv.quantity * price;
  }, 0);

  const totalARS = walletsARS;
  const totalUSD = foreignUSD + portfolioUSD;

  await db.wealthSnapshot.create({
    data: { userId, date: thisMonthStart, walletsARS, foreignUSD, portfolioUSD, totalARS, totalUSD },
  });
}
