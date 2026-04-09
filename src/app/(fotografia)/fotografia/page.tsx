export default function FotografiaDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard Fotografía</h1>
      <p className="mt-1 text-neutral-400">Resumen de tu actividad fotográfica</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-neutral-800 p-6">
          <p className="text-sm text-neutral-400">Sesiones este mes</p>
          <p className="mt-2 text-2xl font-bold text-white">—</p>
        </div>
        <div className="rounded-xl bg-neutral-800 p-6">
          <p className="text-sm text-neutral-400">Ingresos del rubro</p>
          <p className="mt-2 text-2xl font-bold text-green-400">— USD</p>
        </div>
        <div className="rounded-xl bg-neutral-800 p-6">
          <p className="text-sm text-neutral-400">Gastos del rubro</p>
          <p className="mt-2 text-2xl font-bold text-red-400">— USD</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-neutral-800 p-6">
        <p className="text-sm font-medium text-neutral-400">Próximas sesiones</p>
        <p className="mt-4 text-center text-sm text-neutral-500">No hay sesiones programadas</p>
      </div>
    </div>
  );
}
