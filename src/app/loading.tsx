import { CatalogDisabledFilters } from "@/features/Home/CatalogDisabledFilters"
import { CatalogHero } from "@/features/Home/CatalogHero"
import { CatalogPageLayout } from "@/features/Home/CatalogPageLayout"
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton"

export default function Loading() {
  return (
    <CatalogPageLayout>
      <CatalogHero isDisabled />
      <CatalogDisabledFilters />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:gap-5">
        {Array.from({ length: 9 }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
      <p className="sr-only" role="status">
        Cargando productos...
      </p>
    </CatalogPageLayout>
  )
}
