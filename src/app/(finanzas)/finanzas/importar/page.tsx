import { requireSession } from "@/lib/auth";
import ImportForm from "./ImportForm";
import ExportButton from "./ExportButton";
import { LuFileInput, LuFileOutput } from "react-icons/lu";

export default async function ImportarPage() {
  await requireSession();

  return (
    <div className="space-y-10 max-w-4xl">
      {/* ── Importar ── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <LuFileInput size={20} className="text-neutral-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Importar</h1>
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
