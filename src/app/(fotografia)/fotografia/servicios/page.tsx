import { LuCamera, LuCalendar, LuStar } from "react-icons/lu";

const SERVICES = [
  {
    icon: LuCamera,
    type: "Deporte",
    description: "Sesiones de fotografía deportiva — partidos, entrenamientos, competencias.",
    color: "text-blue-400 bg-blue-400/10",
  },
  {
    icon: LuCalendar,
    type: "Evento",
    description: "Eventos sociales y corporativos — casamientos, cumpleaños, fiestas, actos.",
    color: "text-purple-400 bg-purple-400/10",
  },
  {
    icon: LuStar,
    type: "Otro",
    description: "Retratos, productos, contenido para redes y otros encargos especiales.",
    color: "text-yellow-400 bg-yellow-400/10",
  },
];

export default function ServiciosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Servicios</h1>
      <p className="mt-1 text-neutral-400">Tipos de servicio que ofrecés</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.type} className="rounded-xl bg-neutral-800 p-6">
              <div className={`inline-flex rounded-lg p-3 ${s.color}`}>
                <Icon size={20} />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">{s.type}</h2>
              <p className="mt-2 text-sm text-neutral-400">{s.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-neutral-700 p-8 text-center">
        <p className="text-sm text-neutral-500">
          Próximamente: catálogo de precios y paquetes personalizados.
        </p>
      </div>
    </div>
  );
}
