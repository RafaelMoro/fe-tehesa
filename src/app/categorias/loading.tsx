import { Skeleton } from "@heroui/react"

import { CategoryCardSkeleton } from "@/features/CategoriesPage/CategoryCardSkeleton"

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">
      <Skeleton className="h-4 w-32 rounded" />
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-9 w-4/5 rounded md:h-11" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
        <Skeleton className="h-40 w-full rounded-[14px]" />
      </section>
      <Skeleton className="h-4 w-24 rounded" />
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
        {Array.from({ length: 8 }, (_, index) => (
          <CategoryCardSkeleton key={index} />
        ))}
      </div>
      <p className="sr-only" role="status">
        Cargando categorías...
      </p>
    </main>
  )
}
