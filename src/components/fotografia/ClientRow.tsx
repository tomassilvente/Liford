"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LuPencil, LuTrash2, LuCheck, LuX, LuEllipsis } from "react-icons/lu";

interface ClientRowProps {
  id: string;
  name: string;
  instagram: string | null;
  phone: string | null;
  notes: string | null;
  sessionCount: number;
}

export default function ClientRow(props: ClientRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(props.name);
  const [instagram, setInstagram] = useState(props.instagram ?? "");
  const [phone, setPhone] = useState(props.phone ?? "");
  const [notes, setNotes] = useState(props.notes ?? "");

  function resetEdit() {
    setName(props.name);
    setInstagram(props.instagram ?? "");
    setPhone(props.phone ?? "");
    setNotes(props.notes ?? "");
    setEditing(false);
  }

  async function handleSave() {
    setLoading(true);
    const res = await fetch(`/api/fotografia/clients/${props.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, instagram, phone, notes }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Cliente actualizado");
      setEditing(false);
      router.refresh();
    } else {
      toast.error("No se pudo actualizar");
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/fotografia/clients/${props.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Cliente eliminado");
      router.refresh();
    } else {
      toast.error("No se pudo eliminar");
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <p className="mb-1 text-xs text-neutral-500">Nombre</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500">Instagram</p>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">@</span>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="usuario"
                className="w-full rounded-lg bg-neutral-900 py-1.5 pl-6 pr-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500">Teléfono</p>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 9 11..."
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <p className="mb-1 text-xs text-neutral-500">Notas</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-neutral-900 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <LuCheck size={13} />
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            onClick={resetEdit}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-600"
          >
            <LuX size={13} />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{props.name}</p>
        <p className="text-xs text-neutral-500">
          {props.instagram ? `@${props.instagram}` : ""}
          {props.instagram && props.phone ? " · " : ""}
          {props.phone ?? ""}
          {!props.instagram && !props.phone ? "Sin contacto" : ""}
        </p>
      </div>

      <p className="flex-shrink-0 text-xs text-neutral-500">
        {props.sessionCount} {props.sessionCount === 1 ? "sesión" : "sesiones"}
      </p>

      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-700 hover:text-neutral-300 transition-colors"
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
                    <LuPencil size={13} />
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-neutral-600"
                  >
                    <LuTrash2 size={13} />
                    Eliminar
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-1 p-2 w-48">
                  <p className="px-2 py-1 text-xs text-neutral-400">¿Eliminar a {props.name}?</p>
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
    </div>
  );
}
