import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import ImportForm from "./ImportForm";
import ExportButton from "./ExportButton";
import MercadoPagoSync from "@/components/finanzas/MercadoPagoSync";

const MP_CONFIGURED = !!process.env.MERCADOPAGO_ACCESS_TOKEN;

function SectionHeader({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div style={{ borderTop: "4px solid var(--ink)", paddingTop: 12, marginBottom: 20 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>{num}</p>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontStyle: "italic", color: "var(--ink)", margin: "2px 0 0", lineHeight: 0.95, letterSpacing: "-0.02em" }}>{title}</h2>
      <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink3)", margin: "6px 0 0" }}>{sub}</p>
    </div>
  );
}

export default async function ImportarPage() {
  const { userId } = await requireSession();

  const wallets = MP_CONFIGURED
    ? await db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } })
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

      {MP_CONFIGURED && (
        <section>
          <SectionHeader num="IX · Importar — Mercado Pago" title="Sincronizar MP" sub="Traé tus movimientos directamente desde tu cuenta" />
          <MercadoPagoSync wallets={wallets.map((w) => ({ id: w.id, name: w.name, currency: w.currency }))} />
        </section>
      )}

      <section>
        <SectionHeader num={MP_CONFIGURED ? "·· Importar archivo" : "IX · Importar"} title="Importar archivo" sub="Soporta .xlsx, .json y .mmbackup (Gestor de Gastos / Money Manager)" />
        <ImportForm />
      </section>

      <section>
        <SectionHeader num="·· Exportar" title="Exportar" sub="Descargá todas tus transacciones en .xlsx — compatible con Excel y Google Sheets" />
        <ExportButton />
      </section>
    </div>
  );
}
