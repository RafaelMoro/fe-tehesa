import { redirect } from "next/navigation"

import { Home } from "@/features/Home/Home"
import { CatalogPageLayout } from "@/features/Home/CatalogPageLayout"
import {
  fetchBrands,
  fetchCategories,
  getThemePreference,
} from "@/shared/lib/global.lib"
import {
  KNOWN_PRODUCT_TOTAL,
  PRODUCT_PAGE_MAX,
  PRODUCT_PAGE_MIN,
} from "@/shared/constants/catalog.constants"
import {
  DEMO_BRANDS,
  DEMO_CATEGORIES,
  getDemoProducts,
} from "@/shared/data/demo-catalog.data"
import { getStrapiConfig } from "@/shared/utils/strapi-config.utils"
import {
  buildPageOneUrl,
  buildPreviousNoticeUrl,
  getCatalogSelection,
} from "@/features/Pagination/utils.pagination"
import type { MainPageSearchParams } from "@/features/Pagination/types.pagination"
import { ChangeThemeStoreProvider } from "@/zustand/provider/change-theme.provider"

export default async function MainPage({
  searchParams,
}: {
  searchParams: Promise<MainPageSearchParams>
}) {
  const params = await searchParams
  const selection = getCatalogSelection(params)
  const isDemoCatalog = getStrapiConfig() === null

  const [products, categories, brands, themeFetched] = await Promise.all([
    isDemoCatalog
      ? getDemoProducts({
          mode: selection.mode,
          value: selection.value,
          page: selection.page,
        })
      : selection.fetchProducts(),
    isDemoCatalog ? DEMO_CATEGORIES : fetchCategories(),
    isDemoCatalog ? DEMO_BRANDS : fetchBrands(),
    getThemePreference(),
  ])

  if (selection.page > PRODUCT_PAGE_MIN && products.length === 0) {
    if (params.notice === "end") {
      redirect(buildPreviousNoticeUrl(selection))
    }
    redirect(buildPageOneUrl(selection))
  }

  return (
    <ChangeThemeStoreProvider>
      <CatalogPageLayout themeFetched={themeFetched}>
        <Home
          products={products}
          currentPage={selection.page}
          totalPages={isDemoCatalog ? 1 : PRODUCT_PAGE_MAX}
          totalProducts={isDemoCatalog ? products.length : KNOWN_PRODUCT_TOTAL}
          categories={categories}
          brands={brands}
          catalogMode={selection.mode}
          catalogValue={selection.value}
          catalogPage={selection.page}
          hasPreviousCatalogPage={selection.hasPrevious}
          hasNextCatalogPage={!isDemoCatalog && products.length === 50}
          initialCatalogFeedback={
            isDemoCatalog && !selection.feedback
              ? {
                  kind: "status",
                  message:
                    "Catálogo de demostración: precios y existencias son ilustrativos.",
                }
              : selection.feedback
          }
        />
      </CatalogPageLayout>
    </ChangeThemeStoreProvider>
  )
}
