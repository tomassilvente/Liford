"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuPlus, LuX } from "react-icons/lu";
import { toast } from "sonner";
import Link from "next/link";
import type { ClientModel as Client } from "@/generated/prisma/models";

interface SessionFormProps {
  clients: Client[];
}

export default function SessionForm({ clients }: SessionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("SPORT");
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const dateVal = (form.elements.namedItem("date") as HTMLInputElement).value;
    const timeVal = (form.elements.namedItem("time") as HTMLInputElement).value || "00:00";

    const data = {
      clientId: (form.elements.namedItem("clientId") as HTMLSelectElement).value,
      type: (form.elements.namedItem("type") as HTMLSelectElement).value,
      eventName: (form.elements.namedItem("eventName") as HTMLInputElement)?.value || null,
      date: `${dateVal}T${timeVal}:00-03:00`,
      durationMinutes: (form.elements.namedItem("durationMinutes") as HTMLInputElement).value
        ? Number((form.elements.namedItem("durationMinutes") as HTMLInputElement).value)
        : null,
      price: (form.elements.namedItem("price") as HTMLInputElement).value,
      currency: (form.elements.namedItem("currency") as HTMLSelectElement).value,
      notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value || null,
    };

    try {
      const res = await fetch("/api/fotografia/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error al guardar");
      }

      form.reset();
      setType("SPORT");
      setOpen(false);
      toast.success("Sesión creada");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const INPUT = "w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500 placeholder-neutral-600";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        <LuPlus size={15} /> Nueva sesión
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-neutral-900 p-6 shadow-2xl ring-1 ring-neutral-800 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-base font-semibold text-white">Nueva sesión</p>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-neutral-500 hover:text-white">
                <LuX size={16} />
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center">
                <p className="text-neutral-400">Primero necesitás agregar un cliente.</p>
                <Link href="/fotografia/clientes" className="mt-2 inline-block text-sm text-blue-400 hover:underline">
                  Ir a Clientes →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-400">Cliente</label>
                    <select name="clientId" required className={INPUT}>
                      <option value="">Seleccioná un cliente</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-400">Tipo</label>
                    <select name="type" value={type} onChange={(e) => setType(e.target.value)} required className={INPUT}>
                      <option value="SPORT">Deporte</option>
                      <option value="EVENT">Evento</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  </div>

                  {type === "EVENT" && (
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs text-neutral-400">Nombre del evento</label>
                      <input name="eventName" type="text" placeholder="ej: Casamiento García..." className={INPUT} />
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-400">Fecha</label>
                    <input name="date" type="date" defaultValue={today} required className={`${INPUT} [color-scheme:dark]`} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-400">Hora <span className="text-neutral-600">(opcional)</span></label>
                    <input name="time" type="time" className={`${INPUT} [color-scheme:dark]`} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-400">Duración <span className="text-neutral-600">(minutos)</span></label>
                    <input name="durationMinutes" type="number" min="1" placeholder="ej: 90" className={INPUT} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-400">Precio</label>
                    <input name="price" type="number" min="0" step="0.01" required placeholder="0.00" className={INPUT} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-400">Moneda</label>
                    <select name="currency" required className={INPUT}>
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs text-neutral-400">Notas <span className="text-neutral-600">(opcional)</span></label>
                    <textarea name="notes" rows={2} placeholder="Detalles adicionales..." className={`${INPUT} resize-none`} />
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Guardando..." : "Crear sesión"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-neutral-800 px-5 py-2.5 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </>
  );
}
