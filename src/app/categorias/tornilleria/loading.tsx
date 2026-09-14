import { Skeleton } from "@heroui/react"

import { ProductCardSkeleton } from "@/components/ProductCardSkeleton"

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">
      <Skeleton className="h-4 w-40 rounded" />
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
      <div className="flex flex-col gap-3 lg:flex-row">
        <Skeleton className="h-10 w-full rounded lg:flex-1" />
        <Skeleton className="h-10 w-full rounded sm:w-48" />
        <Skeleton className="h-10 w-full rounded sm:w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:gap-5">
        {Array.from({ length: 9 }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
      <p className="sr-only" role="status">
        Cargando productos...
      </p>
    </main>
  )
}
