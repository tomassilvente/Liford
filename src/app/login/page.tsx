"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuLock, LuUser } from "react-icons/lu";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/finanzas");
      router.refresh();
    } else {
      try {
        const data = await res.json();
        setError(data.error ?? "Usuario o contraseña incorrectos");
      } catch {
        setError("Error al iniciar sesión. Intentá de nuevo.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Liford</h1>
          <p className="mt-1 text-sm text-neutral-400">Tu gestor personal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-neutral-900 p-6 ring-1 ring-neutral-800"
        >
          <h2 className="mb-6 text-lg font-semibold text-white">Iniciar sesión</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                Usuario
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <LuUser size={15} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-lg bg-neutral-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-600 ring-1 ring-neutral-700 outline-none focus:ring-blue-500"
                  placeholder="tu usuario"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <LuLock size={15} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg bg-neutral-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-600 ring-1 ring-neutral-700 outline-none focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
