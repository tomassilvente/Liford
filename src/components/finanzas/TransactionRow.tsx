"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuPencil, LuTrash2, LuCheck, LuX, LuEllipsis } from "react-icons/lu";
import { toast } from "sonner";

interface TransactionRowProps {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  currency: string;
  type: "EXPENSE" | "INCOME";
  categories: string[];
  source?: "PERSONAL" | "PHOTOGRAPHY";
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr));
}

const fieldSt: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "var(--paper)", border: "1px solid var(--rule2)",
  padding: "7px 10px", fontFamily: "var(--font-serif)", fontSize: 13,
  color: "var(--ink)", outline: "none",
};

export default function TransactionRow({
  id, description, category, date, amount, currency, type, categories, source = "PERSONAL",
}: TransactionRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [desc, setDesc] = useState(description);
  const [cat, setCat] = useState(category);
  const [amt, setAmt] = useState(String(amount));
  const [dateStr, setDateStr] = useState(date.slice(0, 10));
  const [loading, setLoading] = useState(false);

  const isExpense = type === "EXPENSE";

  async function handleSave() {
    setLoading(true);
    const res = await fetch(`/api/finanzas/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc, category: cat, amount: amt, date: dateStr }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Transacción actualizada");
      setEditing(false);
      router.refresh();
    } else {
      toast.error("No se pudo actualizar");
    }
  }

  function handleCancel() {
    setEditing(false);
    setDesc(description);
    setCat(category);
    setAmt(String(amount));
    setDateStr(date.slice(0, 10));
  }

  async function handleDelete() {
    const res = await fetch(`/api/finanzas/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transacción eliminada");
      router.refresh();
    } else {
      toast.error("No se pudo eliminar");
    }
  }

  // ── Modo edición ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--rule2)", background: "var(--paper2)", display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Descripción"
          style={fieldSt}
        />
        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 140px", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            min="0.01"
            step="0.01"
            style={fieldSt}
          />
          <select value={cat} onChange={(e) => setCat(e.target.value)} style={fieldSt}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            style={fieldSt}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--ink)", color: "var(--paper)", border: "none", padding: "7px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.6 : 1 }}
          >
            <LuCheck size={12} /> Guardar
          </button>
          <button
            onClick={handleCancel}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "var(--ink3)", border: "1px solid var(--rule2)", padding: "7px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
          >
            <LuX size={12} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  const isPhotography = source === "PHOTOGRAPHY";

  // ── Modo normal ───────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-white">{description}</p>
          {isPhotography && (
            <span className="flex-shrink-0 rounded-full bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
              Fotografía
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500">{category} · {formatDate(date)}</p>
      </div>

      <p className={`flex-shrink-0 text-sm font-semibold ${isExpense ? "text-red-400" : "text-green-400"}`}>
        {isExpense ? "-" : "+"}{formatCurrency(amount, currency)}
      </p>

      {isPhotography ? (
        <div className="w-[26px] flex-shrink-0" />
      ) : (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-700 hover:text-neutral-300 transition-colors"
            title="Opciones"
          >
            <LuEllipsis size={15} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirmingDelete(false); }} />
              <div className="absolute right-0 bottom-full z-20 mb-1 flex flex-col overflow-hidden rounded-lg bg-neutral-700 shadow-lg">
                {!confirmingDelete ? (
                  <>
                    <button
                      onClick={() => { setMenuOpen(false); setEditing(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-200 hover:bg-neutral-600"
                    >
                      <LuPencil size={13} /> Editar
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-neutral-600"
                    >
                      <LuTrash2 size={13} /> Eliminar
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-1 p-2 w-44">
                    <p className="px-2 py-1 text-xs text-neutral-400">¿Eliminar esta transacción?</p>
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmingDelete(false); handleDelete(); }}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-md bg-neutral-600 px-3 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-500"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
