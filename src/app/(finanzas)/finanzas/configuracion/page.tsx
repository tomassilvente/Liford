export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import ChangePasswordForm from "./ChangePasswordForm";
import EmailForm from "./EmailForm";

const navLinks = [
  { href: "/finanzas/recurrentes", label: "Recurrentes",  desc: "Gastos e ingresos fijos del mes" },
  { href: "/finanzas/anual",       label: "Anual",        desc: "Resumen del año en curso" },
  { href: "/finanzas/categorias",  label: "Categorías",   desc: "Administrar categorías de transacciones" },
  { href: "/finanzas/importar",    label: "Importar",     desc: "Importar movimientos desde CSV" },
];

export default async function ConfiguracionPage() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });

  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--ink3)", margin: 0, textTransform: "uppercase" }}>IX · Ajustes</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontStyle: "italic", color: "var(--ink)", margin: "4px 0 32px", lineHeight: 0.95, letterSpacing: "-0.02em" }}>Configuración</h1>

      {/* Secciones de herramientas */}
      <div style={{ borderTop: "2px solid var(--ink)", paddingTop: 14, marginBottom: 32 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: "0 0 12px" }}>Herramientas</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} style={{ textDecoration: "none", padding: "12px 14px", border: "1px solid var(--rule2)", background: "var(--paper2)", display: "block" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--ink)", margin: 0 }}>{l.label}</p>
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink3)", margin: "2px 0 0" }}>{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Cuenta */}
      <div style={{ borderTop: "2px solid var(--ink)", paddingTop: 14, marginBottom: 24 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: "0 0 12px" }}>Cuenta</p>
        <div style={{ padding: "12px 14px", background: "var(--paper2)", border: "1px solid var(--rule2)", display: "flex", alignItems: "baseline", gap: 10 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink3)", margin: 0 }}>Usuario</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--ink)", margin: 0, letterSpacing: "0.02em" }}>{session.username}</p>
        </div>
      </div>

      {/* Email */}
      <div style={{ borderTop: "1px solid var(--rule2)", paddingTop: 20, marginBottom: 24 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: "0 0 12px" }}>
          Email de recuperación
          {user?.email && <span style={{ marginLeft: 10, color: "var(--olive)" }}>✓ configurado</span>}
        </p>
        <EmailForm currentEmail={user?.email ?? null} />
      </div>

      {/* Contraseña */}
      <div style={{ borderTop: "1px solid var(--rule2)", paddingTop: 20 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink3)", margin: "0 0 12px" }}>Contraseña</p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
