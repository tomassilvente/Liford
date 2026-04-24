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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Servicios</h1>
        <p className="mt-1 text-neutral-400">Precios y mensajes predefinidos</p>
      </div>

      {/* ── Deportes ── */}
      <section>
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">Deportes</p>
        <div className="overflow-hidden rounded-xl bg-neutral-800">
          {/* Header tabla */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b border-neutral-700 px-4 py-2.5">
            <p className="text-xs font-medium text-neutral-500">Deporte / Tipo</p>
            <p className="text-xs font-medium text-neutral-500">Fotos</p>
            <p className="text-right text-xs font-medium text-neutral-500">Precio</p>
            <p className="text-right text-xs font-medium text-neutral-500">Promo</p>
          </div>

          {Object.entries(deporteGroups).map(([deporte, items]) => (
            <div key={deporte}>
              {items.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b border-neutral-700/50 px-4 py-3 last:border-0 hover:bg-neutral-700/30 transition-colors"
                >
                  <div>
                    {i === 0 && (
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        {deporte}
                      </p>
                    )}
                    <p className="text-sm text-white">{item.tipo}</p>
                  </div>
                  <p className="text-sm text-neutral-400">{item.fotos}</p>
                  <p className="text-right text-sm font-semibold text-white">{fmtARS(item.precio)}</p>
                  <p className="text-right text-sm text-neutral-500">
                    {item.promo ? fmtARS(item.promo) : "—"}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-600">* Precio promo: cuando ambos equipos coordinan juntos</p>
      </section>

      {/* ── Producto ── */}
      <section>
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">Producto</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRODUCTO.map((p) => (
            <div key={p.tipo} className="rounded-xl bg-neutral-800 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-700">
                  <LuImage size={15} className="text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-white">{p.tipo}</p>
              </div>
              <p className="text-xs text-neutral-500">{p.desc}</p>
              <p className="mt-4 text-xl font-bold text-white">
                {fmtARS(p.precio)}
                <span className="ml-1 text-sm font-normal text-neutral-500">{p.unidad}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mensajes predefinidos ── */}
      <section>
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">Mensajes predefinidos</p>
        <div className="flex flex-col gap-3">
          {MENSAJES.map((m, i) => (
            <div key={i} className="rounded-xl bg-neutral-800 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{m.titulo}</p>
                  <p className="text-xs text-neutral-500">{m.subtitulo}</p>
                </div>
                <CopyButton text={m.texto} />
              </div>
              <pre className="whitespace-pre-wrap rounded-lg bg-neutral-900/60 p-3 text-xs leading-relaxed text-neutral-400 font-sans">
                {m.texto}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
