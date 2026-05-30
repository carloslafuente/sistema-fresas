import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-7 w-32" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
    </div>
  );
}

export function CardRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}
