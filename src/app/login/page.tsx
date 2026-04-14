"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuLock, LuUser, LuUserPlus } from "react-icons/lu";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setUsername("");
    setPassword("");
    setDisplayName("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }
    }

    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login"
      ? { username, password }
      : { username, password, displayName };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/finanzas");
      router.refresh();
    } else {
      try {
        const data = await res.json();
        setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
      } catch {
        setError("Error al conectar con el servidor.");
      }
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Liford</h1>
          <p className="mt-1 text-sm text-neutral-400">Tu gestor personal</p>
        </div>

        {/* Toggle login / register */}
        <div className="mb-4 flex rounded-xl bg-neutral-900 p-1 ring-1 ring-neutral-800">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              isLogin ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              !isLogin ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-neutral-900 p-6 ring-1 ring-neutral-800"
        >
          <div className="space-y-4">

            {/* Nombre (solo register) */}
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                  Nombre <span className="text-neutral-600">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    <LuUserPlus size={15} />
                  </span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    className="w-full rounded-lg bg-neutral-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-600 ring-1 ring-neutral-700 outline-none focus:ring-blue-500"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
            )}

            {/* Usuario */}
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
                  placeholder={isLogin ? "tu usuario" : "elige un usuario"}
                />
              </div>
            </div>

            {/* Contraseña */}
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
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full rounded-lg bg-neutral-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-600 ring-1 ring-neutral-700 outline-none focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirmar contraseña (solo register) */}
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    <LuLock size={15} />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-lg bg-neutral-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-600 ring-1 ring-neutral-700 outline-none focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
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
            {loading
              ? isLogin ? "Ingresando..." : "Creando cuenta..."
              : isLogin ? "Ingresar" : "Crear cuenta"
            }
          </button>
        </form>

      </div>
    </div>
  );
}
