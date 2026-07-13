import { redirect } from "next/navigation"

import { Home } from "@/features/Home/Home"
import { Header } from "@/shared/ui/organisms/Header"
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
      <div>
        <Header themeFetched={themeFetched} />
        <main className="flex flex-col gap-7 p-4 sm:p-6">
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
              Suministro industrial
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Piezas precisas para trabajo exigente.
            </h1>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="max-w-xl text-muted">
                Compara rangos de precio y consulta las dimensiones disponibles
                antes de elegir una variante.
              </p>
              <p className="text-sm text-muted">
                {products.length}{" "}
                {products.length === 1 ? "producto" : "productos"}
              </p>
            </div>
          </section>
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
        </main>
      </div>
    </ChangeThemeStoreProvider>
  )
}
