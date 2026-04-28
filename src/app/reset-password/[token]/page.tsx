"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LuLock, LuCheck, LuArrowLeft } from "react-icons/lu";
import { use } from "react";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
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
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30 ring-1 ring-green-800/40">
                <LuCheck size={22} className="text-green-400" />
              </div>
              <p className="text-base font-semibold text-white mb-2">¡Contraseña actualizada!</p>
              <p className="text-sm text-neutral-400">Te redirigimos al login en un momento…</p>
            </div>
          ) : (
            <>
              <p className="mb-1 text-base font-semibold text-white">Nueva contraseña</p>
              <p className="mb-5 text-sm text-neutral-400">Elegí una contraseña nueva para tu cuenta.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-400">Nueva contraseña</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      <LuLock size={15} />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      className="w-full rounded-lg bg-neutral-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-600 ring-1 ring-neutral-700 outline-none focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-400">Confirmar contraseña</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      <LuLock size={15} />
                    </span>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full rounded-lg bg-neutral-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-600 ring-1 ring-neutral-700 outline-none focus:ring-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Guardando..." : "Guardar contraseña"}
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
