function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-800 ${className ?? ""}`} />;
}

export default function IngresosLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-28 bg-neutral-700" />
        <Skeleton className="mt-2 h-4 w-44 bg-neutral-700" />
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-800 px-4 py-3">
            <Skeleton className="h-3 w-12 bg-neutral-700" />
            <Skeleton className="mt-2 h-6 w-28 bg-neutral-700" />
          </div>
        ))}
      </div>

      {/* Formulario skeleton */}
      <div className="rounded-xl bg-neutral-800 p-5">
        <Skeleton className="mb-4 h-5 w-32 bg-neutral-700" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 bg-neutral-700" />
          ))}
        </div>
        <Skeleton className="mt-4 h-10 w-full bg-neutral-700" />
      </div>

      {/* Lista */}
      <div className="rounded-xl bg-neutral-800 p-5">
        <Skeleton className="mb-4 h-5 w-40 bg-neutral-700" />
        <div className="flex flex-col divide-y divide-neutral-700">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-neutral-700" />
                <div>
                  <Skeleton className="h-4 w-36 bg-neutral-700" />
                  <Skeleton className="mt-1 h-3 w-24 bg-neutral-700" />
                </div>
              </div>
              <Skeleton className="h-4 w-20 bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
