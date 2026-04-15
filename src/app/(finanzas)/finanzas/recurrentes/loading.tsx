function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-800 ${className ?? ""}`} />;
}

export default function RecurrentesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36 bg-neutral-700" />
        <Skeleton className="mt-2 h-4 w-52 bg-neutral-700" />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-800 px-4 py-3">
            <Skeleton className="h-3 w-20 bg-neutral-700" />
            <Skeleton className="mt-2 h-6 w-28 bg-neutral-700" />
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-neutral-800 px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full bg-neutral-700" />
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
  );
}
