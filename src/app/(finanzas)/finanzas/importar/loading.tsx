function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-neutral-800 ${className ?? ""}`} />;
}

export default function ImportarLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-28 bg-neutral-700" />
        <Skeleton className="mt-2 h-4 w-64 bg-neutral-700" />
      </div>

      <div className="rounded-xl bg-neutral-800 p-8 text-center">
        <Skeleton className="mx-auto h-12 w-12 rounded-full bg-neutral-700" />
        <Skeleton className="mx-auto mt-4 h-4 w-48 bg-neutral-700" />
        <Skeleton className="mx-auto mt-2 h-3 w-36 bg-neutral-700" />
        <Skeleton className="mx-auto mt-6 h-10 w-32 bg-neutral-700" />
      </div>
    </div>
  );
}
