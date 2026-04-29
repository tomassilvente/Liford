import CopyButton from "@/components/fotografia/CopyButton";
import { LuImage } from "react-icons/lu";

function fmtARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const DEPORTES = [
  { deporte: "Fútbol",   tipo: "Liga Amateur (1 h)",    fotos: "Hasta 220",  precio: 50000,  promo: 40000 },
  { deporte: "Fútbol",   tipo: "Liga Amateur (1.5 h)",  fotos: "Hasta 230",  precio: 70000,  promo: 58000 },
  { deporte: "Fútbol",   tipo: "Liga Profesional",      fotos: "Hasta 230",  precio: 80000,  promo: 67000 },
  { deporte: "Básquet",  tipo: "Liga Amateur",          fotos: "Hasta 220",  precio: 65000,  promo: 52000 },
  { deporte: "Básquet",  tipo: "Primera",               fotos: "Hasta 230",  precio: 75000,  promo: 57000 },
  { deporte: "Hockey",   tipo: "Liga / Primera",        fotos: "Hasta 230",  precio: 65000,  promo: 52000 },
  { deporte: "Media Day",tipo: "Cualquier deporte",     fotos: "Sin límite", precio: 90000,  promo: null  },
];

const PRODUCTO = [
  {
    tipo: "Producto solo",
    desc: "Fotografía en fondo neutro o setup simple. Ideal para catálogo, redes y tienda online.",
    precio: 35000,
    unidad: "/ hora",
  },
  {
    tipo: "Producto + ambiente",
    desc: "Fotos del producto en contexto real. Perfecto para contenido de marca, redes y publicidad.",
    precio: 40000,
    unidad: "/ hora",
  },
];

const MENSAJES: { titulo: string; subtitulo: string; texto: string }[] = [
  {
    titulo: "Fútbol",
    subtitulo: "Liga Amateur (1 h)",
    texto: `📸 Fotografía Deportiva – Fútbol ⚽
¡Hola! Muchas gracias por tu interés en mi servicio de fotografía deportiva. 😊

🔹 ¿Qué incluye el servicio?
📍 Presencia en el partido para capturar los mejores momentos.
📷 Toma de fotos durante todo el encuentro.
🎨 Edición profesional de las imágenes (1.5 veces el tiempo del partido).
🖥️ Entrega en 2-3 días hábiles mediante un enlace a Google Drive con aprox. 180 a 230 fotos en alta calidad.
⏳ El enlace tendrá una validez de 1 mes, ¡no olvides descargarlas a tiempo!

💲 Tarifas:
⏰ $50.000 por equipo
Promo especial: si coordinás con el equipo rival, pagan $40.000 cada uno.

Si querés más info o coordinar un partido, ¡escribime! 🫶🏼`,
  },
  {
    titulo: "Fútbol",
    subtitulo: "Liga Amateur (1.5 h)",
    texto: `📸 Fotografía Deportiva – Fútbol ⚽
¡Hola! Muchas gracias por tu interés en mi servicio de fotografía deportiva. 😊

🔹 ¿Qué incluye el servicio?
📍 Presencia en el partido para capturar los mejores momentos.
📷 Toma de fotos durante todo el encuentro.
🎨 Edición profesional de las imágenes (1.5 veces el tiempo del partido).
🖥️ Entrega en 2-3 días hábiles mediante un enlace a Google Drive con aprox. 180 a 230 fotos en alta calidad.
⏳ El enlace tendrá una validez de 1 mes, ¡no olvides descargarlas a tiempo!

💲 Tarifas:
⏰ $70.000 por equipo (partidos de 1 hora y media)
Promo especial: si coordinás con el equipo rival, pagan $58.000 cada uno.

Si querés más info o coordinar un partido, ¡escribime! 🫶🏼`,
  },
  {
    titulo: "Fútbol",
    subtitulo: "Liga Profesional",
    texto: `📸 Fotografía Deportiva – Fútbol ⚽
¡Hola! Muchas gracias por tu interés en mi servicio de fotografía deportiva. 😊

🔹 ¿Qué incluye el servicio?
📍 Presencia en el partido para capturar los mejores momentos.
📷 Toma de fotos durante todo el encuentro.
🎨 Edición profesional de las imágenes (1.5 veces el tiempo del partido).
🖥️ Entrega en 2-3 días hábiles mediante un enlace a Google Drive con aprox. 180 a 230 fotos en alta calidad.
⏳ El enlace tendrá una validez de 1 mes, ¡no olvides descargarlas a tiempo!

💲 Tarifas:
⏰ $80.000 por equipo (partidos de 1 hora y media)
Promo especial: si coordinás con el equipo rival, pagan $67.000 cada uno.

Si querés más info o coordinar un partido, ¡escribime! 🫶🏼`,
  },
  {
    titulo: "Básquet",
    subtitulo: "Liga Amateur / Inferiores",
    texto: `📸 Fotografía Deportiva – Básquet 🏀
¡Hola! Muchas gracias por tu interés en mi servicio de fotografía deportiva. 😊

🔹 ¿Qué incluye el servicio?
📍 Presencia en el partido para capturar los mejores momentos.
📷 Toma de fotos durante todo el encuentro.
🎨 Edición profesional de las imágenes (1.5 veces el tiempo del partido).
🖥️ Entrega en 2-3 días hábiles mediante un enlace a Google Drive con aprox. 180 a 230 fotos en alta calidad.
⏳ El enlace tendrá una validez de 1 mes, ¡no olvides descargarlas a tiempo!

💲 Tarifas:
🏀 $65.000 por equipo
Promo especial: si coordinás con el equipo rival, pagan $52.000 cada uno.

Si querés más info o coordinar un partido, ¡escribime! 🫶🏼`,
  },
  {
    titulo: "Básquet",
    subtitulo: "Primera",
    texto: `📸 Fotografía Deportiva – Básquet 🏀
¡Hola! Muchas gracias por tu interés en mi servicio de fotografía deportiva. 😊

🔹 ¿Qué incluye el servicio?
📍 Presencia en el partido para capturar los mejores momentos.
📷 Toma de fotos durante todo el encuentro.
🎨 Edición profesional de las imágenes (1.5 veces el tiempo del partido).
🖥️ Entrega en 2-3 días hábiles mediante un enlace a Google Drive con aprox. 180 a 230 fotos en alta calidad.
⏳ El enlace tendrá una validez de 1 mes, ¡no olvides descargarlas a tiempo!

💲 Tarifas:
🏀 $75.000 por equipo
Promo especial: si coordinás con el equipo rival, pagan $57.000 cada uno.

Si querés más info o coordinar un partido, ¡escribime! 🫶🏼`,
  },
  {
    titulo: "Hockey",
    subtitulo: "Liga / Primera",
    texto: `📸 Fotografía Deportiva – Hockey 🏑
¡Hola! Muchas gracias por tu interés en mi servicio de fotografía deportiva. 😊

🔹 ¿Qué incluye el servicio?
📍 Presencia en el partido para capturar los mejores momentos.
📷 Toma de fotos durante todo el encuentro.
🎨 Edición profesional de las imágenes (1.5 veces el tiempo del partido).
🖥️ Entrega en 2-3 días hábiles mediante un enlace a Google Drive con aprox. 170 a 210 fotos en alta calidad.
⏳ El enlace tendrá una validez de 1 mes, ¡no olvides descargarlas a tiempo!

💲 Tarifas:
🏑 $65.000 por equipo
Promo especial: si coordinás con el equipo rival, pagan $52.000 cada uno.

Si querés más info o coordinar un partido, ¡escribime! 🫶🏼`,
  },
  {
    titulo: "Media Day",
    subtitulo: "Cualquier deporte",
    texto: `📸 Media Day 🔥
¡Hola! Muchas gracias por tu interés en mi servicio de fotografía. 😊

🔹 ¿Qué incluye el Media Day?
📍 Sesión fotográfica exclusiva para capturar las mejores imágenes del equipo o jugadores.
📷 Fotos individuales, grupales y en acción según lo que necesiten.
🎨 Edición profesional de todas las imágenes.
🖥️ Entrega en 2-3 días hábiles mediante un enlace a Google Drive con fotos en alta calidad.
⏳ El enlace tendrá una validez de 1 mes, ¡no olvides descargarlas a tiempo!

💲 Tarifa Media Day: $90.000
✅ Sin límite de fotos, me aseguro de capturar y entregar todo el material necesario.

Si querés más info o coordinar tu Media Day, ¡escribime! 📸🔥`,
  },
  {
    titulo: "Producto",
    subtitulo: "Producto solo / Producto + ambiente",
    texto: `📸 Fotografía de Producto ✨
¡Hola! Si tenés un emprendimiento y querés fotos profesionales para potenciar tu marca, te cuento las opciones disponibles:

📷 Opción 1 – Producto solo (sin presencia)
🔹 Fotografía de producto en fondo neutro o setup simple.
🔹 Ideal para catálogo, redes sociales y tienda online.
💲 Tarifa: $35.000 por hora.

📷 Opción 2 – Producto + ambiente (presencial)
🔹 Fotos del producto en contexto, mostrando su uso en un espacio real.
🔹 Perfecto para contenido de marca, redes y publicidad.
💲 Tarifa: $40.000 por hora.

📩 Si querés más info o coordinar una sesión, ¡escribime! 📸✨`,
  },
];

// Agrupar deportes por nombre
const deporteGroups = DEPORTES.reduce<Record<string, typeof DEPORTES>>((acc, d) => {
  if (!acc[d.deporte]) acc[d.deporte] = [];
  acc[d.deporte].push(d);
  return acc;
}, {});

export default function ServiciosPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <header style={{ borderTop: "4px solid var(--foto-ink)", paddingTop: 14 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", color: "var(--foto-accent)", margin: 0, textTransform: "uppercase" }}>III · Servicios</p>
        <h1 style={{ fontFamily: "var(--font-condensed)", fontSize: 48, color: "var(--foto-ink)", margin: "4px 0 0", lineHeight: 0.9, letterSpacing: "0.02em", textTransform: "uppercase" }}>
          Precios
        </h1>
      </header>

      {/* Deportes */}
      <section>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: "0 0 12px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Deportes</p>
        <div style={{ border: "1px solid var(--foto-rule)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 16, borderBottom: "2px solid var(--foto-ink)", padding: "8px 14px" }}>
            {["Deporte / Tipo", "Fotos", "Precio", "Promo"].map((h) => (
              <p key={h} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: h === "Precio" || h === "Promo" ? "right" : "left" }}>{h}</p>
            ))}
          </div>
          {Object.entries(deporteGroups).map(([deporte, items]) =>
            items.map((item, i) => (
              <div key={`${deporte}-${i}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", alignItems: "center", gap: 16, borderBottom: "1px dashed var(--foto-rule)", padding: "10px 14px" }}>
                <div>
                  {i === 0 && <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--foto-accent)", margin: "0 0 2px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{deporte}</p>}
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--foto-ink)", margin: 0 }}>{item.tipo}</p>
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--foto-ink2)", margin: 0 }}>{item.fotos}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--foto-ink)", margin: 0, fontVariantNumeric: "tabular-nums", textAlign: "right", fontWeight: 500 }}>{fmtARS(item.precio)}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--foto-accent)", margin: 0, textAlign: "right" }}>{item.promo ? fmtARS(item.promo) : "—"}</p>
              </div>
            ))
          )}
        </div>
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--foto-accent)", margin: "8px 0 0" }}>* Precio promo: cuando ambos equipos coordinan juntos</p>
      </section>

      {/* Producto */}
      <section>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: "0 0 12px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Producto</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {PRODUCTO.map((p) => (
            <div key={p.tipo} style={{ border: "1px solid var(--foto-rule)", padding: "16px 18px", borderTop: "3px solid var(--foto-ink)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <LuImage size={16} style={{ color: "var(--foto-accent)", flexShrink: 0 }} />
                <p style={{ fontFamily: "var(--font-condensed)", fontSize: 16, color: "var(--foto-ink)", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>{p.tipo}</p>
              </div>
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 13, color: "var(--foto-ink2)", margin: "0 0 12px", lineHeight: 1.5 }}>{p.desc}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--foto-ink)", margin: 0, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                {fmtARS(p.precio)} <span style={{ fontSize: 11, color: "var(--foto-accent)", fontWeight: 400 }}>{p.unidad}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mensajes predefinidos */}
      <section>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--foto-accent)", margin: "0 0 12px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Mensajes predefinidos</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MENSAJES.map((m, i) => (
            <div key={i} style={{ border: "1px solid var(--foto-rule)", background: "var(--foto-paper)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderBottom: "1px solid var(--foto-rule)", background: "var(--foto-paper2)" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-condensed)", fontSize: 15, color: "var(--foto-ink)", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>{m.titulo}</p>
                  <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--foto-ink2)", margin: "2px 0 0" }}>{m.subtitulo}</p>
                </div>
                <CopyButton text={m.texto} />
              </div>
              <pre style={{ whiteSpace: "pre-wrap", padding: "12px 14px", margin: 0, fontFamily: "var(--font-serif)", fontSize: 13, lineHeight: 1.6, color: "var(--foto-ink2)" }}>
                {m.texto}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
