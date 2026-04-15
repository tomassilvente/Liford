function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-800 ${className ?? ""}`} />;
}

export default function BilleterasLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32 bg-neutral-700" />
        <Skeleton className="mt-2 h-4 w-48 bg-neutral-700" />
      </div>

      {/* Tarjetas de billeteras */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-800 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-neutral-700" />
              <Skeleton className="h-6 w-12 rounded-full bg-neutral-700" />
            </div>
            <Skeleton className="mt-4 h-8 w-36 bg-neutral-700" />
            <Skeleton className="mt-2 h-3 w-20 bg-neutral-700" />
          </div>
        ))}
      </div>

      {/* Cuentas foráneas */}
      <div>
        <Skeleton className="mb-3 h-4 w-36 bg-neutral-700" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-neutral-800 p-5">
              <Skeleton className="h-4 w-24 bg-neutral-700" />
              <Skeleton className="mt-4 h-8 w-32 bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
