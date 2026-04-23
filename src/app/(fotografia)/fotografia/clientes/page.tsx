export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import ClientForm from "@/components/fotografia/ClientForm";
import ClientRow from "@/components/fotografia/ClientRow";

export default async function ClientesPage() {
  const { userId } = await requireSession();

  const clients = await db.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { sessions: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Clientes</h1>
      <p className="mt-1 text-neutral-400">Administrá tu cartera de clientes</p>

      <div className="mt-6">
        <ClientForm />
      </div>

      <div className="mt-8">
        {clients.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay clientes todavía.</p>
        ) : (
          <div className="rounded-xl bg-neutral-800 divide-y divide-neutral-700">
            {clients.map((c) => (
              <ClientRow
                key={c.id}
                id={c.id}
                name={c.name}
                instagram={c.instagram}
                phone={c.phone}
                notes={c.notes}
                sessionCount={c._count.sessions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
