"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--paper)", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--ink3)", margin: "0 0 4px", textTransform: "uppercase" }}>Almanaque · MMXXVI</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, fontStyle: "italic", color: "var(--ink)", margin: 0, lineHeight: 0.9, letterSpacing: "-0.02em" }}>Liford</h1>
        </div>

        {/* Toggle login / register */}
        <div style={{ marginBottom: 16, display: "flex", border: "1px solid var(--ink)" }}>
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{ flex: 1, padding: "8px 0", background: isLogin ? "var(--ink)" : "transparent", color: isLogin ? "var(--paper)" : "var(--ink3)", border: "none", fontFamily: "var(--font-serif)", fontSize: 13, fontStyle: isLogin ? "normal" : "italic", cursor: "pointer", borderRight: "1px solid var(--ink)" }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            style={{ flex: 1, padding: "8px 0", background: !isLogin ? "var(--ink)" : "transparent", color: !isLogin ? "var(--paper)" : "var(--ink3)", border: "none", fontFamily: "var(--font-serif)", fontSize: 13, fontStyle: !isLogin ? "normal" : "italic", cursor: "pointer" }}
          >
            Crear cuenta
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ background: "var(--paper2)", border: "1px solid var(--rule2)", padding: 24 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {!isLogin && (
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 6 }}>
                  Nombre <span style={{ color: "var(--rule2)" }}>(opcional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }}><LuUserPlus size={14} /></span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule2)", padding: "9px 10px 9px 32px", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 6 }}>Usuario</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }}><LuUser size={14} /></span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule2)", padding: "9px 10px 9px 32px", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
                  placeholder={isLogin ? "tu usuario" : "elige un usuario"}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 6 }}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }}><LuLock size={14} /></span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule2)", padding: "9px 10px 9px 32px", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 6 }}>Confirmar contraseña</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }}><LuLock size={14} /></span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule2)", padding: "9px 10px 9px 32px", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p style={{ marginTop: 14, padding: "8px 12px", border: "1px solid var(--brick)", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--brick)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 20, width: "100%", background: "var(--ink)", color: "var(--paper)", border: "none", padding: "11px 0", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading
              ? isLogin ? "Ingresando..." : "Creando cuenta..."
              : isLogin ? "Ingresar" : "Crear cuenta"
            }
          </button>

          {isLogin && (
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <Link href="/forgot-password" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink3)", textDecoration: "none" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}

