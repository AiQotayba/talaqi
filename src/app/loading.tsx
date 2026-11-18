import { CoursesSkeletonGrid, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header Skeleton */}
      <div className="space-y-3 pb-6 border-b border-slate-100">
        <Skeleton className="h-9 w-56 rounded-2xl" />
        <Skeleton className="h-4 w-80 max-w-full rounded-lg bg-slate-200/60" />
      </div>

      {/* Main Grid Skeleton */}
      <CoursesSkeletonGrid count={6} />
    </div>
  );
}
