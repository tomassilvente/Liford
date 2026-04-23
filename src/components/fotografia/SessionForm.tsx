"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ClientModel as Client } from "@/generated/prisma/models";

interface SessionFormProps {
  clients: Client[];
}

export default function SessionForm({ clients }: SessionFormProps) {
  const router = useRouter();
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
      toast.success("Sesión creada");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center">
        <p className="text-neutral-400">Primero necesitás agregar un cliente.</p>
        <a href="/fotografia/clientes" className="mt-2 inline-block text-sm text-blue-400 hover:underline">
          Ir a Clientes →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-neutral-800 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Cliente */}
        <div>
          <label htmlFor="clientId" className="mb-1.5 block text-sm text-neutral-400">Cliente</label>
          <select
            id="clientId"
            name="clientId"
            required
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          >
            <option value="">Seleccioná un cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm text-neutral-400">Tipo</label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          >
            <option value="SPORT">Deporte</option>
            <option value="EVENT">Evento</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        {/* Nombre del evento */}
        {type === "EVENT" && (
          <div className="sm:col-span-2">
            <label htmlFor="eventName" className="mb-1.5 block text-sm text-neutral-400">Nombre del evento</label>
            <input
              id="eventName"
              name="eventName"
              type="text"
              placeholder="ej: Casamiento García, Cumpleaños 15..."
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Fecha */}
        <div>
          <label htmlFor="date" className="mb-1.5 block text-sm text-neutral-400">Fecha</label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            required
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500 [color-scheme:dark]"
          />
        </div>

        {/* Hora */}
        <div>
          <label htmlFor="time" className="mb-1.5 block text-sm text-neutral-400">
            Hora <span className="text-neutral-600">(opcional)</span>
          </label>
          <input
            id="time"
            name="time"
            type="time"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500 [color-scheme:dark]"
          />
        </div>

        {/* Duración */}
        <div>
          <label htmlFor="durationMinutes" className="mb-1.5 block text-sm text-neutral-400">
            Duración <span className="text-neutral-600">(minutos, opcional)</span>
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min="1"
            placeholder="ej: 90"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>

        {/* Precio */}
        <div>
          <label htmlFor="price" className="mb-1.5 block text-sm text-neutral-400">Precio</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          />
        </div>

        {/* Moneda */}
        <div>
          <label htmlFor="currency" className="mb-1.5 block text-sm text-neutral-400">Moneda</label>
          <select
            id="currency"
            name="currency"
            required
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
          >
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
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
            placeholder="Detalles adicionales..."
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Crear sesión"}
      </button>
    </form>
  );
}
