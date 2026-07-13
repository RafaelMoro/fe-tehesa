import { redirect } from "next/navigation"

import { Home } from "@/features/Home/Home"
import { CatalogPageLayout } from "@/features/Home/CatalogPageLayout"
import {
  fetchBrands,
  fetchCategories,
  getThemePreference,
} from "@/shared/lib/global.lib"
import {
  PRODUCT_PAGE_MAX,
  PRODUCT_PAGE_MIN,
} from "@/shared/constants/catalog.constants"
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

  const [products, categories, brands, themeFetched] = await Promise.all([
    selection.fetchProducts(),
    fetchCategories(),
    fetchBrands(),
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
          totalPages={PRODUCT_PAGE_MAX}
          categories={categories}
          brands={brands}
          catalogMode={selection.mode}
          catalogValue={selection.value}
          catalogPage={selection.page}
          hasPreviousCatalogPage={selection.hasPrevious}
          hasNextCatalogPage={products.length === 50}
          initialCatalogFeedback={selection.feedback}
        />
      </CatalogPageLayout>
    </ChangeThemeStoreProvider>
  )
}
