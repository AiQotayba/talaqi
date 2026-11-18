import { StatsDashboardSkeleton } from "@/components/ui/skeleton";

export default function LoadingAdminStats() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <StatsDashboardSkeleton />
    </div>
  );
}
