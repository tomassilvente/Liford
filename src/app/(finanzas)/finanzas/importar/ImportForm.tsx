"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LuUpload, LuCheck, LuX, LuLoader, LuTriangle } from "react-icons/lu";

interface ImportedTransaction {
  date: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  currency: "ARS" | "USD";
  category: string;
  description: string;
  source: "PERSONAL";
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const TYPE_LABELS: Record<string, string> = {
  EXPENSE: "Gasto",
  INCOME: "Ingreso",
};

export default function ImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportedTransaction[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [done, setDone] = useState<number | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setPreview(null);
    setDone(null);
    setParsing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/finanzas/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al procesar el archivo"); return; }
      setPreview(data.transactions);
      setSelected(new Set(data.transactions.map((_: unknown, i: number) => i)));
    } catch {
      setError("Error de red al subir el archivo");
    } finally {
      setParsing(false);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function toggleAll() {
    if (!preview) return;
    if (selected.size === preview.length) setSelected(new Set());
    else setSelected(new Set(preview.map((_, i) => i)));
  }

  function toggleRow(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function handleConfirm() {
    if (!preview || selected.size === 0) return;
    setSaving(true);
    setError(null);

    const transactions = [...selected].map((i) => preview[i]);
    try {
      const res = await fetch("/api/finanzas/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }
      setDone(data.imported);
      setPreview(null);
      router.refresh();
    } catch {
      setError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Drop zone */}
      {!preview && !done && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
            border: `2px dashed ${dragging ? "var(--ink)" : "var(--rule2)"}`,
            background: dragging ? "var(--paper3)" : "var(--paper2)",
            padding: "48px 24px", cursor: "pointer",
          }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.json,.mmbackup" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {parsing ? (
            <LuLoader size={28} style={{ color: "var(--navy)" }} className="animate-spin" />
          ) : (
            <LuUpload size={28} style={{ color: "var(--ink3)" }} />
          )}
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "var(--ink2)", margin: 0 }}>
            {parsing ? "Procesando archivo..." : "Arrastrá o hacé clic para seleccionar"}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink3)", margin: 0, letterSpacing: "0.08em" }}>XLSX · JSON · MMBACKUP</p>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderLeft: "3px solid var(--brick)", background: "var(--paper2)", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--brick)" }}>
          <LuTriangle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {done !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderLeft: "3px solid var(--olive)", background: "var(--paper2)", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--olive)" }}>
            <LuCheck size={15} style={{ flexShrink: 0 }} /> Se importaron {done} transacciones correctamente.
          </div>
          <button onClick={() => { setDone(null); setError(null); }} style={{ alignSelf: "flex-start", background: "transparent", border: "1px solid var(--rule2)", padding: "7px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink3)", cursor: "pointer" }}>
            Importar otro archivo
          </button>
        </div>
      )}

      {preview && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink3)", margin: 0 }}>
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{preview.length}</span> transacciones —{" "}
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{selected.size}</span> seleccionadas
            </p>
            <button onClick={() => { setPreview(null); setSelected(new Set()); }} style={{ background: "transparent", border: "none", color: "var(--ink3)", cursor: "pointer" }}>
              <LuX size={15} />
            </button>
          </div>

          <div style={{ overflowX: "auto", border: "1px solid var(--rule2)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--ink)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 400, fontSize: 9, color: "var(--ink3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    <input type="checkbox" checked={selected.size === preview.length} onChange={toggleAll} style={{ accentColor: "var(--ink)" }} />
                  </th>
                  {["Fecha", "Tipo", "Categoría", "Descripción", "Monto"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Monto" ? "right" : "left", fontWeight: 400, fontSize: 9, color: "var(--ink3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((t, i) => (
                  <tr key={i} onClick={() => toggleRow(i)} style={{ borderBottom: "1px dashed var(--rule)", cursor: "pointer", opacity: selected.has(i) ? 1 : 0.35, background: "transparent" }}>
                    <td style={{ padding: "8px 12px" }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(i)} onChange={() => toggleRow(i)} style={{ accentColor: "var(--ink)" }} />
                    </td>
                    <td style={{ padding: "8px 12px", color: "var(--ink2)", whiteSpace: "nowrap" }}>{t.date}</td>
                    <td style={{ padding: "8px 12px", color: t.type === "INCOME" ? "var(--olive)" : "var(--brick)", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 9 }}>
                      {TYPE_LABELS[t.type]}
                    </td>
                    <td style={{ padding: "8px 12px", color: "var(--ink2)" }}>{t.category}</td>
                    <td style={{ padding: "8px 12px", color: "var(--ink3)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || "—"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: t.type === "INCOME" ? "var(--olive)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                      {fmt(t.amount, t.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleConfirm}
              disabled={saving || selected.size === 0}
              style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "9px 20px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", opacity: (saving || selected.size === 0) ? 0.5 : 1 }}
            >
              {saving ? "Importando..." : `Importar ${selected.size}`}
            </button>
            <button
              onClick={() => { setPreview(null); setSelected(new Set()); setError(null); }}
              style={{ background: "transparent", border: "1px solid var(--rule2)", padding: "9px 16px", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", color: "var(--ink3)", cursor: "pointer" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
