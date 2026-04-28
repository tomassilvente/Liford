export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import ChangePasswordForm from "./ChangePasswordForm";
import EmailForm from "./EmailForm";
import { LuMail, LuShieldCheck } from "react-icons/lu";

export default async function ConfiguracionPage() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Configuración</h1>
      <p className="mt-1 text-neutral-400">Ajustes de tu cuenta</p>

      <div className="mt-8 max-w-md space-y-4">

        {/* Cuenta */}
        <div className="rounded-xl bg-neutral-900 p-6 ring-1 ring-neutral-800">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Cuenta</p>
          <p className="text-sm text-white">
            Usuario: <span className="font-medium">{session.username}</span>
          </p>
        </div>

        {/* Email */}
        <div className="rounded-xl bg-neutral-900 p-6 ring-1 ring-neutral-800">
          <div className="mb-4 flex items-center gap-2">
            <LuMail size={14} className="text-neutral-500" />
            <p className="text-sm font-medium text-white">Email de recuperación</p>
            {user?.email && (
              <span className="ml-auto flex items-center gap-1 rounded-full bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-green-800/30">
                <LuShieldCheck size={10} /> Configurado
              </span>
            )}
          </div>
          <EmailForm currentEmail={user?.email ?? null} />
        </div>

        {/* Cambiar contraseña */}
        <div className="rounded-xl bg-neutral-900 p-6 ring-1 ring-neutral-800">
          <p className="mb-4 text-sm font-medium text-white">Cambiar contraseña</p>
          <ChangePasswordForm />
        </div>

      </div>
    </div>
  );
}
