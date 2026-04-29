"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { LuPencil, LuTrash2, LuCheck, LuX, LuEllipsis, LuMessageCircle, LuChevronRight } from "react-icons/lu";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(props.name);
  const [instagram, setInstagram] = useState(props.instagram ?? "");
  const [phone, setPhone] = useState(props.phone ?? "");
  const [notes, setNotes] = useState(props.notes ?? "");

  function resetEdit() {
    setName(props.name); setInstagram(props.instagram ?? "");
    setPhone(props.phone ?? ""); setNotes(props.notes ?? "");
    setEditing(false);
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

  if (editing) {
    return (
      <div style={{ padding: "14px 16px", borderBottom: "1px dashed var(--foto-rule)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Nombre</p>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputSt} />
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
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--foto-ink)", color: "var(--foto-paper)", border: "none", padding: "7px 14px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            <LuCheck size={12} /> {loading ? "Guardando..." : "Guardar"}
          </button>
          <button onClick={resetEdit} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--foto-rule)", color: "var(--foto-accent)", padding: "7px 12px", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer" }}>
            <LuX size={12} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  const rawPhone = props.phone?.replace(/\D/g, "");
  const whatsappUrl = rawPhone ? `https://wa.me/${rawPhone.startsWith("54") ? rawPhone : `54${rawPhone}`}` : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: "1px dashed var(--foto-rule)" }}>
      <Link href={`/fotografia/clientes/${props.id}`} style={{ minWidth: 0, flex: 1, textDecoration: "none" }}>
        <p style={{ fontFamily: "var(--font-condensed)", fontSize: 17, color: "var(--foto-ink)", margin: 0, letterSpacing: "0.02em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{props.name}</p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {props.instagram ? `@${props.instagram}` : ""}
          {props.instagram && props.phone ? " · " : ""}
          {props.phone ?? ""}
          {!props.instagram && !props.phone ? "Sin contacto" : ""}
        </p>
      </Link>

      <p style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--foto-accent)", letterSpacing: "0.06em" }}>
        {props.sessionCount} {props.sessionCount === 1 ? "sesión" : "sesiones"}
      </p>

      {whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, color: "var(--olive)", lineHeight: 1 }} title="WhatsApp">
          <LuMessageCircle size={15} />
        </a>
      )}

      <Link href={`/fotografia/clientes/${props.id}`} style={{ flexShrink: 0, color: "var(--foto-rule)", lineHeight: 1 }}>
        <LuChevronRight size={15} />
      </Link>

      <div style={{ position: "relative", flexShrink: 0 }}>
        <button onClick={() => setMenuOpen((v) => !v)} style={{ background: "transparent", border: "none", color: "var(--foto-rule)", cursor: "pointer", lineHeight: 1 }}>
          <LuEllipsis size={15} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setConfirmingDelete(false); }} />
            <div style={{ position: "absolute", right: 0, bottom: "100%", zIndex: 20, marginBottom: 4, background: "var(--foto-paper2)", border: "1px solid var(--foto-rule)", minWidth: 130 }}>
              {!confirmingDelete ? (
                <>
                  <button onClick={() => { setMenuOpen(false); setEditing(true); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "transparent", border: "none", fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--foto-ink)", cursor: "pointer", textAlign: "left" }}>
                    <LuPencil size={12} /> Editar
                  </button>
                  <button onClick={() => setConfirmingDelete(true)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderTop: "1px solid var(--foto-rule)", fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--brick)", cursor: "pointer", textAlign: "left" }}>
                    <LuTrash2 size={12} /> Eliminar
                  </button>
                </>
              ) : (
                <div style={{ padding: 10 }}>
                  <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--foto-ink2)", margin: "0 0 8px" }}>¿Eliminar a {props.name}?</p>
                  <button onClick={() => { setMenuOpen(false); setConfirmingDelete(false); handleDelete(); }} style={{ display: "block", width: "100%", background: "var(--brick)", color: "var(--foto-paper)", border: "none", padding: "7px 0", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", cursor: "pointer", marginBottom: 4 }}>Sí</button>
                  <button onClick={() => setConfirmingDelete(false)} style={{ display: "block", width: "100%", background: "transparent", border: "1px solid var(--foto-rule)", color: "var(--foto-accent)", padding: "7px 0", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer" }}>No</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
