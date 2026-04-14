export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ConfiguracionPage() {
  const session = await requireSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Configuración</h1>
      <p className="mt-1 text-neutral-400">Ajustes de tu cuenta</p>

      <div className="mt-8 max-w-md">
        <div className="rounded-xl bg-neutral-900 p-6 ring-1 ring-neutral-800">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Cuenta</p>
            <p className="mt-2 text-sm text-white">
              Usuario: <span className="font-medium">{session.username}</span>
            </p>
          </div>
          <div className="border-t border-neutral-800 pt-6">
            <p className="mb-4 text-sm font-medium text-white">Cambiar contraseña</p>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
