import { SkeletonHeader, SkeletonTable } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <SkeletonHeader />
      <div className="px-4 py-5 md:px-8 md:py-6">
        <SkeletonTable rows={5} />
      </div>
    </>
  );
}
