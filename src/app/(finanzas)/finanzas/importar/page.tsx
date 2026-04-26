import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import ImportForm from "./ImportForm";
import ExportButton from "./ExportButton";
import MercadoPagoSync from "@/components/finanzas/MercadoPagoSync";
import { LuFileInput, LuFileOutput } from "react-icons/lu";

const MP_CONFIGURED = !!process.env.MERCADOPAGO_ACCESS_TOKEN;

export default async function ImportarPage() {
  const { userId } = await requireSession();

  const wallets = MP_CONFIGURED
    ? await db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } })
    : [];

  return (
    <div className="space-y-10 max-w-4xl">

      {/* ── Mercado Pago ── */}
      {MP_CONFIGURED && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#009ee3]/15">
              <span className="text-xs font-black text-[#009ee3]">MP</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Mercado Pago</h2>
              <p className="mt-0.5 text-sm text-neutral-400">
                Sincronizá tus movimientos directamente desde tu cuenta
              </p>
            </div>
          </div>
          <MercadoPagoSync wallets={wallets.map((w) => ({ id: w.id, name: w.name, currency: w.currency }))} />
        </section>
      )}

      {MP_CONFIGURED && <div className="border-t border-neutral-800" />}

      {/* ── Importar archivo ── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <LuFileInput size={20} className="text-neutral-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Importar archivo</h1>
            <p className="mt-0.5 text-sm text-neutral-400">
              Soporta{" "}
              <span className="text-neutral-300">.xlsx</span>,{" "}
              <span className="text-neutral-300">.json</span> y{" "}
              <span className="text-neutral-300">.mmbackup</span>{" "}
              (Gestor de Gastos / Money Manager)
            </p>
          </div>
        </div>
        <ImportForm />
      </section>

      <div className="border-t border-neutral-800" />

      {/* ── Exportar ── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <LuFileOutput size={20} className="text-neutral-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Exportar</h2>
            <p className="mt-0.5 text-sm text-neutral-400">
              Descargá todas tus transacciones en formato{" "}
              <span className="text-neutral-300">.xlsx</span>{" "}
              — compatible con Excel, Google Sheets y Numbers
            </p>
          </div>
        </div>
        <ExportButton />
      </section>
    </div>
  );
}
