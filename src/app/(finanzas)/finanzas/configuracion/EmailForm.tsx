"use client";

import { useState } from "react";

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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setSuccess(false); }}
        required
        placeholder="tu@email.com"
        autoComplete="email"
        style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule2)", padding: "9px 10px", fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const }}
      />

      {!currentEmail && (
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink3)", margin: 0 }}>
          Necesitás un email para recuperar tu contraseña si la olvidás.
        </p>
      )}

      {error && <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--brick)", margin: 0, padding: "8px 12px", border: "1px solid var(--brick)" }}>{error}</p>}
      {success && <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--olive)", margin: 0 }}>Email actualizado correctamente.</p>}

      <button
        type="submit"
        disabled={loading || !email.trim()}
        style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "10px 0", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", opacity: (loading || !email.trim()) ? 0.5 : 1 }}
      >
        {loading ? "Guardando…" : "Guardar email"}
      </button>
    </form>
  );
}
