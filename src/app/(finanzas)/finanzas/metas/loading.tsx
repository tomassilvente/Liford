function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-800 ${className ?? ""}`} />;
}

export default function MetasLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-20 bg-neutral-700" />
        <Skeleton className="mt-2 h-4 w-48 bg-neutral-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-800 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32 bg-neutral-700" />
              <Skeleton className="h-5 w-12 rounded-full bg-neutral-700" />
            </div>
            <Skeleton className="mt-4 h-2 w-full rounded-full bg-neutral-700" />
            <div className="mt-3 flex justify-between">
              <Skeleton className="h-3 w-20 bg-neutral-700" />
              <Skeleton className="h-3 w-20 bg-neutral-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
