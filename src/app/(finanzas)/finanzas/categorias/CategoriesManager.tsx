"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuPlus, LuPencil, LuTrash2, LuCheck, LuX } from "react-icons/lu";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
  sortOrder: number;
  children: Category[];
}

interface Props {
  categories: Category[];
}

const COLORS = [
  "#3b82f6","#1d4ed8","#06b6d4","#0891b2",
  "#10b981","#16a34a","#84cc16","#65a30d",
  "#ef4444","#dc2626","#ec4899","#db2777",
  "#8b5cf6","#7c3aed","#6366f1","#4f46e5",
  "#f59e0b","#d97706","#f97316","#ea580c",
  "#14b8a6","#0d9488","#a855f7","#9333ea",
  "#6b7280","#374151","#f1f5f9","#e2e8f0",
];
const ICONS  = ["🍔","🚗","🎬","❤️","💡","👕","📚","📺","✈️","🏠","💼","💰","🎁","⚽","🎵","📱","🐾","🌿","☕","🛍️","🏥","💊","🎓","🎮","🍷","🏋️","💈","🧴","🔧","⚡","🌎","🎨","🏖️","🍕","🚀","🎯","💎","🧾","🏦","🔑"];

const INPUT = "rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500";
const EMPTY = { name: "", icon: "", color: COLORS[0], type: "EXPENSE" };

function CategoryRow({
  cat,
  onRefresh,
}: {
  cat: Category;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: cat.name, icon: cat.icon ?? "", color: cat.color ?? COLORS[0], type: cat.type });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/finanzas/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success("Categoría actualizada"); setEditing(false); router.refresh(); }
    else toast.error("No se pudo guardar");
  }

  async function remove() {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    const res = await fetch(`/api/finanzas/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminada"); router.refresh(); }
    else toast.error("No se pudo eliminar");
  }

  if (editing) {
    return (
      <div className="rounded-xl bg-neutral-800 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre"
            className={`${INPUT} flex-1 min-w-[140px]`}
            autoFocus
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className={INPUT}
          >
            <option value="EXPENSE">Gasto</option>
            <option value="INCOME">Ingreso</option>
            <option value="BOTH">Ambos</option>
          </select>
        </div>
        <div>
          <p className="mb-1.5 text-xs text-neutral-500">Ícono</p>
          <div className="mb-2 flex items-center gap-2">
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="Pegá tu emoji"
              className={`${INPUT} w-24 text-center text-lg`}
              maxLength={8}
            />
            <span className="text-xs text-neutral-500">o elegí:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setForm({ ...form, icon })}
                className={`rounded-lg p-1.5 text-lg transition-colors ${form.icon === icon ? "bg-neutral-600 ring-1 ring-neutral-500" : "hover:bg-neutral-700"}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs text-neutral-500">Color</p>
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                style={{ background: c }}
                className={`h-6 w-6 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-white/40" : "hover:scale-110"}`}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving || !form.name} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            <LuCheck size={13} /> Guardar
          </button>
          <button onClick={() => setEditing(false)} className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-600">
            <LuX size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-neutral-800 px-4 py-3">
      {cat.icon ? (
        <span className="text-lg">{cat.icon}</span>
      ) : (
        <span
          className="h-5 w-5 rounded-full flex-shrink-0"
          style={{ background: cat.color ?? "#6b7280" }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{cat.name}</p>
        <p className="text-xs text-neutral-500">
          {cat.type === "EXPENSE" ? "Gasto" : cat.type === "INCOME" ? "Ingreso" : "Ambos"}
          {cat.children.length > 0 && ` · ${cat.children.length} subcategorías`}
        </p>
      </div>
      {cat.color && (
        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
      )}
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-white">
          <LuPencil size={13} />
        </button>
        <button onClick={remove} className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-700 hover:text-red-400">
          <LuTrash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function CategoriesManager({ categories }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [activeType, setActiveType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  async function handleAdd() {
    if (!form.name) return;
    setSaving(true);
    const res = await fetch("/api/finanzas/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type: activeType }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Categoría creada"); setAdding(false); setForm(EMPTY); router.refresh(); }
    else toast.error("No se pudo crear (¿ya existe?)");
  }

  const filtered = categories.filter(
    (c) => !c.children || c.type === activeType || c.type === "BOTH"
  );

  return (
    <div className="space-y-4">
      {/* Tab Gastos / Ingresos */}
      <div className="flex gap-1">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              activeType === t ? "bg-neutral-700 text-white" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
            }`}
          >
            {t === "EXPENSE" ? "Gastos" : "Ingresos"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <CategoryRow key={c.id} cat={c} onRefresh={() => router.refresh()} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-neutral-500">No hay categorías personalizadas de este tipo todavía.</p>
        )}
      </div>

      {adding ? (
        <div className="rounded-xl bg-neutral-800 p-4 space-y-3">
          <p className="text-sm font-medium text-white">Nueva categoría</p>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre (ej: Restaurantes)"
            className={`${INPUT} w-full`}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <div>
            <p className="mb-1.5 text-xs text-neutral-500">Ícono</p>
            <div className="mb-2 flex items-center gap-2">
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Pegá tu emoji"
                className={`${INPUT} w-24 text-center text-lg`}
                maxLength={8}
              />
              <span className="text-xs text-neutral-500">o elegí:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`rounded-lg p-1.5 text-lg ${form.icon === icon ? "bg-neutral-600 ring-1 ring-neutral-500" : "hover:bg-neutral-700"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-neutral-500">Color</p>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  style={{ background: c }}
                  className={`h-6 w-6 rounded-full ${form.color === c ? "scale-125 ring-2 ring-white/40" : "hover:scale-110"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={saving || !form.name} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              <LuCheck size={13} /> {saving ? "Creando..." : "Crear"}
            </button>
            <button onClick={() => { setAdding(false); setForm(EMPTY); }} className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-600">
              <LuX size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
        >
          <LuPlus size={15} /> Nueva categoría
        </button>
      )}
    </div>
  );
}
