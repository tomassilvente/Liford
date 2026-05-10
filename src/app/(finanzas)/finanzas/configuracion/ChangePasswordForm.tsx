"use client";

import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--paper)",
  border: "1px solid var(--rule2)",
  padding: "9px 10px",
  fontFamily: "var(--font-serif)",
  fontSize: 14,
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink3)",
  marginBottom: 6,
};

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (next !== confirm) { setError("Las contraseñas nuevas no coinciden"); return; }
    if (next.length < 6) { setError("Mínimo 6 caracteres"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al cambiar la contraseña");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>Contraseña actual</label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Nueva contraseña</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required autoComplete="new-password" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Confirmar nueva contraseña</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" style={inputStyle} />
      </div>

      {error && <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--brick)", margin: 0, padding: "8px 12px", border: "1px solid var(--brick)" }}>{error}</p>}
      {success && <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--olive)", margin: 0 }}>Contraseña actualizada correctamente.</p>}

      <button
        type="submit"
        disabled={loading}
        style={{ background: "var(--ink)", color: "var(--paper)", border: "none", padding: "10px 0", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Guardando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
