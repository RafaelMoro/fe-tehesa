import { Skeleton } from "@heroui/react"

export const ProductCardSkeleton = () => (
  <div className="flex h-full flex-col gap-3.5 rounded-[14px] border border-gray-200 bg-white p-4 max-sm:p-3.5 dark:border-gray-800 dark:bg-gray-900">
    <Skeleton className="aspect-[4/3] w-full rounded-[10px] max-sm:aspect-video" />
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="h-3 w-2/5 rounded" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
    <Skeleton className="h-[23px] w-4/5 rounded" />
    <Skeleton className="h-[23px] w-3/5 rounded" />
    <Skeleton className="h-5 w-24 rounded-full" />
    <div className="mt-auto flex flex-col gap-1">
      <Skeleton className="h-3 w-12 rounded" />
      <Skeleton className="h-7 w-1/2 rounded" />
      <Skeleton className="h-3 w-1/3 rounded" />
    </div>
    <div className="flex flex-col gap-2">
      <Skeleton className="h-11 w-full rounded-[10px] md:h-10" />
      <Skeleton className="h-11 w-full rounded-[10px] md:h-10" />
    </div>
  </div>
)
