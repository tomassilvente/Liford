"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { LuPencil, LuTrash2, LuCheck, LuX, LuMessageCircle } from "react-icons/lu";

interface ClientRowProps {
  id: string;
  name: string;
  instagram: string | null;
  phone: string | null;
  notes: string | null;
  sessionCount: number;
}

const inputSt: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "var(--foto-paper)", border: "1px solid var(--foto-rule)",
  padding: "7px 10px", fontFamily: "var(--font-serif)", fontSize: 13,
  color: "var(--foto-ink)", outline: "none",
};

export default function ClientRow(props: ClientRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(props.name);
  const [instagram, setInstagram] = useState(props.instagram ?? "");
  const [phone, setPhone] = useState(props.phone ?? "");
  const [notes, setNotes] = useState(props.notes ?? "");

  function resetEdit() {
    setName(props.name); setInstagram(props.instagram ?? "");
    setPhone(props.phone ?? ""); setNotes(props.notes ?? "");
    setEditing(false); setConfirmingDelete(false);
  }

  async function handleSave() {
    setLoading(true);
    const res = await fetch(`/api/fotografia/clients/${props.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, instagram, phone, notes }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Cliente actualizado"); setEditing(false); router.refresh(); }
    else toast.error("No se pudo actualizar");
  }

  async function handleDelete() {
    const res = await fetch(`/api/fotografia/clients/${props.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Cliente eliminado"); router.refresh(); }
    else toast.error("No se pudo eliminar");
  }

  const initials = props.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const rawPhone = props.phone?.replace(/\D/g, "");
  const whatsappUrl = rawPhone ? `https://wa.me/${rawPhone.startsWith("54") ? rawPhone : `54${rawPhone}`}` : null;
  const contactLine = [
    props.instagram ? `@${props.instagram}` : null,
    props.phone ?? null,
  ].filter(Boolean).join(" · ") || "Sin contacto";

  if (editing) {
    return (
      <div style={{ border: "1px solid var(--foto-ink)", background: "var(--foto-paper)", padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Nombre</p>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputSt} autoFocus />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Instagram</p>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario" style={inputSt} />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Teléfono</p>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 9 11..." style={inputSt} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Notas</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputSt, resize: "none" }} />
          </div>
        </div>

        {confirmingDelete ? (
          <div style={{ marginBottom: 10, padding: "10px 12px", background: "var(--foto-paper2)", border: "1px solid var(--foto-rule)" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--foto-ink2)", margin: "0 0 8px" }}>¿Eliminar a {props.name}?</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setConfirmingDelete(false); handleDelete(); }} style={{ background: "var(--brick)", color: "var(--foto-paper)", border: "none", padding: "6px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", cursor: "pointer" }}>Sí, eliminar</button>
              <button onClick={() => setConfirmingDelete(false)} style={{ background: "transparent", border: "1px solid var(--foto-rule)", color: "var(--foto-accent)", padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--foto-ink)", color: "var(--foto-paper)", border: "none", padding: "7px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              <LuCheck size={12} /> {loading ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={resetEdit} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--foto-rule)", color: "var(--foto-accent)", padding: "7px 12px", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer" }}>
              <LuX size={12} /> Cancelar
            </button>
          </div>
          <button onClick={() => setConfirmingDelete(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--brick)", padding: "7px 4px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", cursor: "pointer" }}>
            <LuTrash2 size={12} /> Eliminar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid var(--foto-rule)", background: "var(--foto-paper)", display: "flex", flexDirection: "column" }}>
      {/* Main area → detail page */}
      <Link href={`/fotografia/clientes/${props.id}`} style={{ display: "block", padding: "16px", textDecoration: "none", flex: 1 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{
            width: 42, height: 42, flexShrink: 0,
            border: "1.5px solid var(--foto-ink)", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-condensed)", fontSize: 16, letterSpacing: "0.04em",
            color: "var(--foto-ink)", textTransform: "uppercase",
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-condensed)", fontSize: 22, color: "var(--foto-ink)", margin: 0, letterSpacing: "0.02em", textTransform: "uppercase", lineHeight: 1.05, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {props.name}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", margin: "5px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {contactLine}
            </p>
            {props.notes && (
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--foto-ink2)", margin: "6px 0 0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                {props.notes}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Footer: session count + actions */}
      <div style={{ borderTop: "1px dashed var(--foto-rule)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", letterSpacing: "0.06em" }}>
          {props.sessionCount} {props.sessionCount === 1 ? "sesión" : "sesiones"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, color: "var(--olive)", lineHeight: 1, textDecoration: "none" }} title="WhatsApp">
              <LuMessageCircle size={15} />
            </a>
          )}
          <button onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "transparent", border: "none", color: "var(--foto-accent)", cursor: "pointer", lineHeight: 1 }} title="Editar">
            <LuPencil size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
