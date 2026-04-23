"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      instagram: (form.elements.namedItem("instagram") as HTMLInputElement).value || null,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value || null,
      notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value || null,
    };

    try {
      const res = await fetch("/api/fotografia/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error al guardar");
      }

      form.reset();
      toast.success("Cliente agregado");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-neutral-800 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Nombre */}
        <div className="sm:col-span-2">
          <label htmlFor="name" className="mb-1.5 block text-sm text-neutral-400">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="ej: Juan García"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>

        {/* Instagram */}
        <div>
          <label htmlFor="instagram" className="mb-1.5 block text-sm text-neutral-400">
            Instagram <span className="text-neutral-600">(opcional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">@</span>
            <input
              id="instagram"
              name="instagram"
              type="text"
              placeholder="usuario"
              className="w-full rounded-lg bg-neutral-900 py-2 pl-7 pr-3 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm text-neutral-400">
            Teléfono <span className="text-neutral-600">(opcional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="ej: +54 9 11 1234 5678"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>

        {/* Notas */}
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="mb-1.5 block text-sm text-neutral-400">
            Notas <span className="text-neutral-600">(opcional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Detalles del cliente..."
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Agregar cliente"}
      </button>
    </form>
  );
}
