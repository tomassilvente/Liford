export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import CategoriesManager from "./CategoriesManager";

export default async function CategoriasPage() {
  const { userId } = await requireSession();

  const categories = await db.category.findMany({
    where: { userId, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { children: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });

  const serialized = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type,
    sortOrder: c.sortOrder,
    children: c.children.map((ch) => ({
      id: ch.id,
      name: ch.name,
      icon: ch.icon,
      color: ch.color,
      type: ch.type,
      sortOrder: ch.sortOrder,
      children: [],
    })),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Categorías</h1>
      <p className="mt-1 mb-8 text-sm text-neutral-400">
        Personalizá tus categorías con íconos y colores. Se usan en transacciones y presupuestos.
      </p>
      <div className="max-w-2xl">
        <CategoriesManager categories={serialized} />
      </div>
    </div>
  );
}
