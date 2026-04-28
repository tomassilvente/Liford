"use client";

import { useState } from "react";
import { LuMail, LuCheck } from "react-icons/lu";

export default function EmailForm({ currentEmail }: { currentEmail: string | null }) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/auth/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo actualizar el email");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
          <LuMail size={15} />
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setSuccess(false); }}
          required
          placeholder="tu@email.com"
          autoComplete="email"
          className="w-full rounded-lg bg-neutral-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500"
        />
      </div>

      {!currentEmail && (
        <p className="text-xs text-neutral-600">
          Necesitás un email para poder recuperar tu contraseña si la olvidás.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && (
        <p className="flex items-center gap-1.5 text-sm text-green-400">
          <LuCheck size={13} /> Email actualizado correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Guardando..." : "Guardar email"}
      </button>
    </form>
  );
}
