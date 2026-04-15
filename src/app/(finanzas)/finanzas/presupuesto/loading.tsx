function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-800 ${className ?? ""}`} />;
}

export default function PresupuestoLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36 bg-neutral-700" />
        <Skeleton className="mt-2 h-4 w-52 bg-neutral-700" />
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-800 px-4 py-3">
            <Skeleton className="h-3 w-16 bg-neutral-700" />
            <Skeleton className="mt-2 h-6 w-24 bg-neutral-700" />
          </div>
        ))}
      </div>

      {/* Categorías con barras de progreso */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 bg-neutral-700" />
              <Skeleton className="h-4 w-24 bg-neutral-700" />
            </div>
            <Skeleton className="mt-3 h-2 w-full rounded-full bg-neutral-700" />
            <Skeleton className="mt-1.5 h-3 w-16 bg-neutral-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
