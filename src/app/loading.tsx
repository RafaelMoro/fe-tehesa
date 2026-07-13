import { CatalogDisabledFilters } from "@/features/Home/CatalogDisabledFilters"
import { CatalogHero } from "@/features/Home/CatalogHero"
import { CatalogPageLayout } from "@/features/Home/CatalogPageLayout"

export default function Loading() {
  return (
    <CatalogPageLayout themeFetched="light">
      <CatalogHero isDisabled />
      <CatalogDisabledFilters />
      <p className="sr-only" role="status">
        Cargando productos...
      </p>
    </CatalogPageLayout>
  )
}
