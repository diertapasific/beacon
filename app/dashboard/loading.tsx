import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-10 w-64 mb-8" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[260px] rounded-[2rem]" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[120px] rounded-[2rem]" />
          <Skeleton className="h-[120px] rounded-[2rem]" />
        </div>
      </div>
      <Skeleton className="h-6 w-40 mt-10 mb-5" />
      <div className="grid sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
