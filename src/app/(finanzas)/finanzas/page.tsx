export default function FinanzasDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard Finanzas</h1>
      <p className="mt-1 text-neutral-400">Resumen general de tu situación financiera</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-neutral-800 p-6">
          <p className="text-sm text-neutral-400">Billeteras virtuales</p>
          <p className="mt-2 text-2xl font-bold text-white">— ARS</p>
        </div>
        <div className="rounded-xl bg-neutral-800 p-6">
          <p className="text-sm text-neutral-400">Portfolio inversiones</p>
          <p className="mt-2 text-2xl font-bold text-white">— USD</p>
        </div>
        <div className="rounded-xl bg-neutral-800 p-6">
          <p className="text-sm text-neutral-400">Cuentas foráneas</p>
          <p className="mt-2 text-2xl font-bold text-white">— USD</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-neutral-800 p-6">
          <p className="text-sm text-neutral-400">Gastos del mes</p>
          <p className="mt-2 text-2xl font-bold text-red-400">— ARS</p>
        </div>
        <div className="rounded-xl bg-neutral-800 p-6">
          <p className="text-sm text-neutral-400">Ingresos del mes</p>
          <p className="mt-2 text-2xl font-bold text-green-400">— ARS</p>
        </div>
      </div>
    </div>
  );
}
