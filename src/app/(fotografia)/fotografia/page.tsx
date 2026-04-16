export const dynamic = "force-dynamic";

import { LuCamera, LuClock } from "react-icons/lu";

export default function FotografiaDashboard() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-neutral-800 p-5">
        <LuCamera size={32} className="text-neutral-400" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-white">Fotografía</h1>
      <div className="mt-3 flex items-center gap-1.5 text-neutral-500">
        <LuClock size={14} />
        <p className="text-sm">Estamos trabajando — programado para el próximo mes</p>
      </div>
    </div>
  );
}
