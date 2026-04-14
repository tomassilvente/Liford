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
    <div className="space-y-6">
      {/* Drop zone */}
      {!preview && !done && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-16 transition-colors ${
            dragging ? "border-blue-500 bg-blue-950/20" : "border-neutral-700 hover:border-neutral-500"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.json,.mmbackup"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {parsing ? (
            <LuLoader size={32} className="animate-spin text-blue-400" />
          ) : (
            <LuUpload size={32} className="text-neutral-500" />
          )}
          <p className="text-sm text-neutral-400">
            {parsing ? "Procesando archivo..." : "Arrastrá o hacé clic para seleccionar"}
          </p>
          <p className="text-xs text-neutral-600">Formatos: .xlsx, .json, .mmbackup</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-950 px-4 py-3 text-sm text-red-400">
          <LuTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Success */}
      {done !== null && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-green-950 px-4 py-3 text-sm text-green-400">
            <LuCheck size={16} className="shrink-0" />
            Se importaron {done} transacciones correctamente.
          </div>
          <button
            onClick={() => { setDone(null); setError(null); }}
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
          >
            Importar otro archivo
          </button>
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-400">
              <span className="font-medium text-white">{preview.length}</span> transacciones encontradas —{" "}
              <span className="font-medium text-white">{selected.size}</span> seleccionadas
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setPreview(null); setSelected(new Set()); }}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-white transition-colors"
                title="Cancelar"
              >
                <LuX size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-xs text-neutral-500">
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === preview.length}
                      onChange={toggleAll}
                      className="accent-blue-500"
                    />
                  </th>
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">Categoría</th>
                  <th className="px-3 py-3">Descripción</th>
                  <th className="px-3 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {preview.map((t, i) => (
                  <tr
                    key={i}
                    onClick={() => toggleRow(i)}
                    className={`cursor-pointer transition-colors hover:bg-neutral-800/50 ${
                      !selected.has(i) ? "opacity-40" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleRow(i)}
                        className="accent-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-neutral-300 whitespace-nowrap">{t.date}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-medium ${t.type === "INCOME" ? "text-green-400" : "text-red-400"}`}>
                        {TYPE_LABELS[t.type]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-neutral-300">{t.category}</td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate text-neutral-500">{t.description || "—"}</td>
                    <td className={`px-3 py-2.5 text-right font-medium whitespace-nowrap ${
                      t.type === "INCOME" ? "text-green-400" : "text-neutral-200"
                    }`}>
                      {fmt(t.amount, t.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirm}
              disabled={saving || selected.size === 0}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? "Importando..." : `Importar ${selected.size} transacciones`}
            </button>
            <button
              onClick={() => { setPreview(null); setSelected(new Set()); setError(null); }}
              className="rounded-xl bg-neutral-800 px-5 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
