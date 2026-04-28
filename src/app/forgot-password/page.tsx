"use client";

import { useState } from "react";
import Link from "next/link";
import { LuUser, LuArrowLeft, LuCheck } from "react-icons/lu";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    setLoading(false);

    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Liford</h1>
          <p className="mt-1 text-sm text-neutral-400">Tu gestor personal</p>
        </div>

        <div className="rounded-xl bg-neutral-900 p-6 ring-1 ring-neutral-800">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30 ring-1 ring-green-800/40">
                <LuCheck size={22} className="text-green-400" />
              </div>
              <p className="text-base font-semibold text-white mb-2">Revisá tu email</p>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Si el usuario <strong className="text-neutral-200">{username}</strong> tiene un email registrado, vas a recibir un link para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <LuArrowLeft size={13} /> Volver al login
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-1 text-base font-semibold text-white">¿Olvidaste tu contraseña?</p>
              <p className="mb-5 text-sm text-neutral-400">
                Ingresá tu usuario y te mandamos un link al email que tenés registrado.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-400">Usuario</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      <LuUser size={15} />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                      placeholder="tu usuario"
                      className="w-full rounded-lg bg-neutral-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-600 ring-1 ring-neutral-700 outline-none focus:ring-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Enviando..." : "Enviar link"}
                </button>
              </form>

              <Link
                href="/login"
                className="mt-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <LuArrowLeft size={13} /> Volver al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
