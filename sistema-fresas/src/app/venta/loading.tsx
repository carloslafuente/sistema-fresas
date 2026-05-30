import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b h-12 px-4 flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-10" />
      </div>
      <div className="flex-1 flex flex-col gap-5 p-4 max-w-sm mx-auto w-full">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-16 rounded-xl mt-auto" />
      </div>
    </div>
  );
}
