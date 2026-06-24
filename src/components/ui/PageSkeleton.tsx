/** Esqueletos CSS puros — sin animaciones JS pesadas */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4 p-4 md:p-6 lg:p-8">
      <div className="h-8 w-48 rounded-lg bg-surface-highlight" />
      <div className="h-4 w-72 max-w-full rounded bg-surface-highlight/70" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded bg-surface-highlight" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/5 rounded bg-surface-highlight" />
              <div className="h-2 w-2/5 rounded bg-surface-highlight/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:p-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-square rounded-lg bg-surface-highlight" />
          <div className="h-3 w-4/5 rounded bg-surface-highlight/80" />
        </div>
      ))}
    </div>
  );
}
