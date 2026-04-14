"use client";

import { useState } from "react";
import { LuDownload, LuLoader } from "react-icons/lu";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/finanzas/export");
      if (!res.ok) { alert("Error al exportar"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `liford_transacciones_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-neutral-800 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors border border-neutral-700"
    >
      {loading ? <LuLoader size={16} className="animate-spin" /> : <LuDownload size={16} />}
      {loading ? "Generando archivo..." : "Descargar .xlsx"}
    </button>
  );
}
