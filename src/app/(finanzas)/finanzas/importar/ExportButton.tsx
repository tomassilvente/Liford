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
      style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--ink)", color: "var(--paper)", border: "none", padding: "10px 20px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.6 : 1 }}
    >
      {loading ? <LuLoader size={14} className="animate-spin" /> : <LuDownload size={14} />}
      {loading ? "Generando..." : "Descargar .xlsx"}
    </button>
  );
}
