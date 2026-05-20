/**
 * Skeleton placeholders for perceived-performance during SSR streaming.
 *
 * Usage:
 *   <SkeletonRow />              <- single row skeleton
 *   <SkeletonTable rows={6} />   <- table-shaped block
 *   <SkeletonCard />             <- card-shaped block
 *   <SkeletonGrid cards={6} />   <- grid of cards
 */

export function SkeletonBox({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <SkeletonBox className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBox className="h-3 w-1/3" />
        <SkeletonBox className="h-2.5 w-1/2" />
      </div>
      <SkeletonBox className="h-6 w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <SkeletonBox className="h-3 w-24" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="px-4">
            <SkeletonRow />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <SkeletonBox className="mb-3 h-3 w-20" />
      <SkeletonBox className="mb-2 h-5 w-2/3" />
      <SkeletonBox className="mb-4 h-3 w-1/2" />
      <SkeletonBox className="h-3 w-16" />
    </div>
  );
}

export function SkeletonGrid({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-white/70 px-4 py-5 backdrop-blur-sm md:px-8 md:py-6 dark:border-slate-800/80 dark:bg-slate-950/70">
      <SkeletonBox className="mb-2 h-7 w-48" />
      <SkeletonBox className="h-3 w-72" />
    </header>
  );
}
