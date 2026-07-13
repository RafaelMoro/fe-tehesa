"use client"

import { CatalogDisabledFilters } from "@/features/Home/CatalogDisabledFilters"
import { CatalogHero } from "@/features/Home/CatalogHero"
import { CatalogPageLayout } from "@/features/Home/CatalogPageLayout"

export default function Error({ reset }: { reset: () => void }) {
  return (
    <CatalogPageLayout themeFetched="light">
      <CatalogHero
        statusText="No pudimos cargar los productos."
        actionLabel="Reintentar"
        onAction={reset}
      />
      <CatalogDisabledFilters />
      <p className="sr-only" role="alert">
        No se pudo recuperar la información de productos. Inténtalo de nuevo.
      </p>
    </CatalogPageLayout>
  )
}
