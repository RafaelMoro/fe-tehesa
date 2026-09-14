import { Skeleton } from "@heroui/react"

export const CategoryCardSkeleton = () => (
  <div className="flex flex-col gap-3 rounded-[14px] border border-default-200 p-5 dark:border-[#1E3608]">
    <div className="flex items-center justify-between">
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
    <Skeleton className="h-[23px] w-4/5 rounded" />
    <Skeleton className="mt-auto h-4 w-24 rounded" />
  </div>
)
