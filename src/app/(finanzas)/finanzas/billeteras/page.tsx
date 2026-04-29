export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { fetchCotizaciones } from "@/lib/cotizaciones";
import { requireSession } from "@/lib/auth";
import WalletCard from "@/components/finanzas/WalletCard";
import WalletForm from "@/components/finanzas/WalletForm";
import ForeignAccountCard from "@/components/finanzas/ForeignAccountCard";
import ForeignAccountForm from "@/components/finanzas/ForeignAccountForm";
import Link from "next/link";

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export default async function BilleterasPage() {
  const { userId } = await requireSession();

  const [wallets, foreignAccounts, investments] = await Promise.all([
    db.wallet.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    db.foreignAccount.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    db.investment.findMany({ where: { userId } }),
  ]);

  const tickers = investments.map((i) => i.ticker);
  const cotizaciones = tickers.length > 0 ? await fetchCotizaciones(tickers) : {};

  const portfolioUSD = investments.reduce((sum, inv) => {
    const price = cotizaciones[inv.ticker]?.price ?? inv.avgBuyPrice;
    return sum + inv.quantity * price;
  }, 0);

  const totalARS = wallets.filter((w) => w.currency === "ARS").reduce((s, w) => s + w.balance, 0);
  const walletsUSD = wallets.filter((w) => w.currency === "USD").reduce((s, w) => s + w.balance, 0);
  const foreignUSD = foreignAccounts.filter((a) => a.currency === "USD").reduce((s, a) => s + a.balance, 0);
  const totalUSD = walletsUSD + foreignUSD + portfolioUSD;

  return (
    <div>
      {/* Page header */}
      <div style={{ borderTop: "4px solid var(--ink)", paddingTop: 12, marginBottom: 24 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>II · Patrimonio</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontStyle: "italic", color: "var(--ink)", margin: "4px 0 0", lineHeight: 0.95, letterSpacing: "-0.02em" }}>El estado de cuentas</h1>
      </div>

      {/* Totales */}
      <div className="mt-6 flex flex-wrap gap-3">
        {totalARS > 0 && (
          <div style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: "12px 20px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--ink3)", textTransform: "uppercase", margin: 0 }}>Total ARS</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>{fmtARS(totalARS)}</p>
          </div>
        )}
        <div style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: "12px 20px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--ink3)", textTransform: "uppercase", margin: 0 }}>Total USD</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>{fmtUSD(totalUSD)}</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", marginTop: 2 }}>
            {[
              walletsUSD > 0 && `Billeteras ${fmtUSD(walletsUSD)}`,
              foreignUSD > 0 && `Foráneas ${fmtUSD(foreignUSD)}`,
              portfolioUSD > 0 && `Portfolio ${fmtUSD(portfolioUSD)}`,
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* Billeteras locales */}
      <div className="mt-8">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--ink3)", textTransform: "uppercase", marginBottom: 12 }}>Billeteras</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((w) => (
            <WalletCard key={w.id} wallet={w} />
          ))}
          <WalletForm />
        </div>
      </div>

      {/* Cuentas foráneas */}
      <div className="mt-8">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--ink3)", textTransform: "uppercase", marginBottom: 12 }}>
          Cuentas foráneas
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 11, textTransform: "none", letterSpacing: 0, color: "var(--ink3)", marginLeft: 8 }}>Payoneer, Wise, Deel, etc.</span>
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foreignAccounts.map((a) => (
            <ForeignAccountCard key={a.id} account={a} />
          ))}
          <ForeignAccountForm />
        </div>
      </div>

      {/* Portfolio */}
      {investments.length > 0 && (
        <div className="mt-8">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--ink3)", textTransform: "uppercase", marginBottom: 12 }}>Portfolio de inversiones</p>
          <div style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: 20 }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--ink2)" }}>Valor actual del portfolio</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>{fmtUSD(portfolioUSD)}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", marginTop: 4 }}>{investments.length} activos · Precios en tiempo real</p>
              </div>
              <Link
                href="/finanzas/inversiones"
                style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "8px 16px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", display: "inline-block" }}
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
