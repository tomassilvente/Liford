export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { fetchCotizaciones } from "@/lib/cotizaciones";
import WalletCard from "@/components/finanzas/WalletCard";
import WalletForm from "@/components/finanzas/WalletForm";
import Link from "next/link";

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export default async function BilleterasPage() {
  const [wallets, investments] = await Promise.all([
    db.wallet.findMany({ orderBy: { createdAt: "asc" } }),
    db.investment.findMany(),
  ]);

  const tickers = investments.map((i) => i.ticker);
  const cotizaciones = tickers.length > 0 ? await fetchCotizaciones(tickers) : {};

  const portfolioUSD = investments.reduce((sum, inv) => {
    const price = cotizaciones[inv.ticker]?.price ?? inv.avgBuyPrice;
    return sum + inv.quantity * price;
  }, 0);

  const totalARS = wallets.filter((w) => w.currency === "ARS").reduce((s, w) => s + w.balance, 0);
  const walletsUSD = wallets.filter((w) => w.currency === "USD").reduce((s, w) => s + w.balance, 0);
  const totalUSD = walletsUSD + portfolioUSD;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Billeteras</h1>
      <p className="mt-1 text-neutral-400">Tus billeteras, cuentas y portfolio</p>

      {/* Totales */}
      <div className="mt-6 flex flex-wrap gap-3">
        {totalARS > 0 && (
          <div className="rounded-xl bg-neutral-900 px-5 py-3">
            <p className="text-xs text-neutral-400">Total ARS</p>
            <p className="mt-1 text-lg font-bold text-white">{fmtARS(totalARS)}</p>
          </div>
        )}
        <div className="rounded-xl bg-neutral-900 px-5 py-3">
          <p className="text-xs text-neutral-400">Total USD</p>
          <p className="mt-1 text-lg font-bold text-white">{fmtUSD(totalUSD)}</p>
          {investments.length > 0 && (
            <p className="mt-0.5 text-xs text-neutral-600">
              Billeteras {fmtUSD(walletsUSD)} + Portfolio {fmtUSD(portfolioUSD)}
            </p>
          )}
        </div>
      </div>

      {/* Billeteras */}
      <div className="mt-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Billeteras</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((w) => (
            <WalletCard key={w.id} wallet={w} />
          ))}
          <WalletForm />
        </div>
      </div>

      {/* Portfolio como card de solo lectura */}
      {investments.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Portfolio de inversiones</p>
          <div className="rounded-xl bg-neutral-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Valor actual del portfolio</p>
                <p className="mt-1 text-2xl font-bold text-white">{fmtUSD(portfolioUSD)}</p>
                <p className="mt-1 text-xs text-neutral-500">{investments.length} activos · Precios en tiempo real</p>
              </div>
              <Link
                href="/finanzas/inversiones"
                className="rounded-lg bg-neutral-700 px-4 py-2 text-sm text-white hover:bg-neutral-600"
              >
                Ver inversiones →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
