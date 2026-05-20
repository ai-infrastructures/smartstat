import { SkeletonBox, SkeletonHeader } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <SkeletonHeader />
      <div className="px-4 py-5 md:px-8 md:py-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <SkeletonBox className="mb-3 h-3 w-16" />
              <SkeletonBox className="h-7 w-10" />
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SkeletonBox className="mb-3 h-3 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <SkeletonBox key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <SkeletonBox className="mb-3 h-3 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <SkeletonBox key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
