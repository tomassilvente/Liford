function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-800 ${className ?? ""}`} />;
}

export default function InversionesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-36 bg-neutral-700" />
        <Skeleton className="mt-2 h-4 w-56 bg-neutral-700" />
      </div>

      {/* Resumen portfolio — 4 tarjetas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-800 px-4 py-3">
            <Skeleton className="h-3 w-16 bg-neutral-700" />
            <Skeleton className="mt-2 h-7 w-24 bg-neutral-700" />
          </div>
        ))}
      </div>

      {/* Gráfico de allocación */}
      <div className="rounded-xl bg-neutral-800 p-5">
        <Skeleton className="mb-5 h-4 w-32 bg-neutral-700" />
        <Skeleton className="mx-auto h-40 w-40 rounded-full bg-neutral-700" />
      </div>

      {/* Lista de activos */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-neutral-700" />
                <div>
                  <Skeleton className="h-4 w-16 bg-neutral-700" />
                  <Skeleton className="mt-1 h-3 w-24 bg-neutral-700" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-20 bg-neutral-700" />
                <Skeleton className="mt-1 h-3 w-14 bg-neutral-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
