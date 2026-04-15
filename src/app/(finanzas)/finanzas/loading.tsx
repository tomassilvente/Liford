function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-800 ${className ?? ""}`} />;
}

function StatCard() {
  return (
    <div className="rounded-xl bg-neutral-800 p-5">
      <Skeleton className="h-4 w-24 bg-neutral-700" />
      <Skeleton className="mt-3 h-7 w-32 bg-neutral-700" />
      <Skeleton className="mt-2 h-3 w-20 bg-neutral-700" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40 bg-neutral-700" />
        <Skeleton className="mt-2 h-4 w-56 bg-neutral-700" />
      </div>

      {/* Patrimonio */}
      <section>
        <Skeleton className="mb-3 h-3 w-24 bg-neutral-700" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard />
          <StatCard />
          <StatCard />
          <StatCard />
        </div>
      </section>

      {/* Mes actual */}
      <section>
        <Skeleton className="mb-3 h-3 w-28 bg-neutral-700" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard />
          <StatCard />
          <StatCard />
          <StatCard />
        </div>
      </section>

      {/* Gráficos */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-neutral-800 p-5">
          <Skeleton className="h-4 w-40 bg-neutral-700" />
          <Skeleton className="mt-1 h-3 w-24 bg-neutral-700" />
          <Skeleton className="mt-5 h-40 bg-neutral-700" />
        </div>
        <div className="rounded-xl bg-neutral-800 p-5">
          <Skeleton className="h-4 w-40 bg-neutral-700" />
          <Skeleton className="mt-1 h-3 w-32 bg-neutral-700" />
          <Skeleton className="mt-5 h-40 bg-neutral-700" />
        </div>
      </section>

      {/* Últimas transacciones */}
      <section>
        <div className="rounded-xl bg-neutral-800 p-5">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-40 bg-neutral-700" />
            <Skeleton className="h-4 w-24 bg-neutral-700" />
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full bg-neutral-700" />
                  <div>
                    <Skeleton className="h-4 w-32 bg-neutral-700" />
                    <Skeleton className="mt-1 h-3 w-24 bg-neutral-700" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20 bg-neutral-700" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
