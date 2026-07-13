import { redirect } from "next/navigation"

import { Home } from "@/features/Home/Home"
import { Header } from "@/shared/ui/organisms/Header"
import {
  fetchBrands,
  fetchCategories,
  fetchProducts,
  fetchProductsByBrand,
  fetchProductsByCategory,
  fetchProductsByName,
  getThemePreference,
} from "@/shared/lib/global.lib"
import {
  PRODUCT_PAGE_MAX,
  PRODUCT_PAGE_MIN,
  SEARCH_TERM_MAX_LENGTH,
  SEARCH_TERM_PATTERN,
} from "@/shared/constants/catalog.constants"
import type {
  CatalogMode,
  InitialCatalogFeedback,
  Product,
} from "@/shared/types/global.types"
import { ChangeThemeStoreProvider } from "@/zustand/provider/change-theme.provider"

type MainPageSearchParams = {
  page?: string
  mode?: string
  q?: string
  category?: string
  brand?: string
  notice?: string
}

type CatalogSelection = {
  mode: CatalogMode
  value: string | null
  page: number
  fetchProducts: () => Promise<Product[]>
  hasPrevious: boolean
  feedback: InitialCatalogFeedback
}

const DIGITS_ONLY = /^[0-9]+$/

const redirectToBase = (): never => {
  return redirect("/?page=1")
}

const parseBasePage = (raw: string | undefined) => {
  const pageParam = raw ?? "1"
  if (!DIGITS_ONLY.test(pageParam)) {
    redirectToBase()
  }
  const page = Number.parseInt(pageParam, 10)
  if (page < PRODUCT_PAGE_MIN || page > PRODUCT_PAGE_MAX) {
    redirectToBase()
  }
  return page
}

const parseWidePage = (raw: string | undefined) => {
  const pageParam = raw ?? "1"
  if (!DIGITS_ONLY.test(pageParam)) {
    redirectToBase()
  }
  const page = Number.parseInt(pageParam, 10)
  if (page < PRODUCT_PAGE_MIN) {
    redirectToBase()
  }
  return page
}

const parseModeValue = (raw: string | undefined) => {
  if (raw === undefined) {
    return redirectToBase()
  }
  const trimmed = raw.trim()
  if (
    trimmed.length === 0 ||
    trimmed.length > SEARCH_TERM_MAX_LENGTH ||
    !SEARCH_TERM_PATTERN.test(trimmed)
  ) {
    redirectToBase()
  }
  return trimmed
}

const buildModeUrl = (
  mode: "name" | "category" | "brand",
  value: string,
  page: number,
  notice?: "end",
) => {
  const key = mode === "name" ? "q" : mode
  const params = new URLSearchParams({
    mode,
    [key]: value,
    page: String(page),
  })
  if (notice) {
    params.set("notice", notice)
  }
  return `/?${params.toString()}`
}

const buildPageOneUrl = (selection: CatalogSelection) => {
  if (selection.mode === "base") {
    return "/?page=1"
  }
  return buildModeUrl(selection.mode, selection.value ?? "", PRODUCT_PAGE_MIN)
}

const buildPreviousNoticeUrl = (selection: CatalogSelection) => {
  const previousPage = Math.max(PRODUCT_PAGE_MIN, selection.page - 1)
  if (selection.mode === "base") {
    return `/?page=${previousPage}&notice=end`
  }
  return buildModeUrl(
    selection.mode,
    selection.value ?? "",
    previousPage,
    "end",
  )
}

const getCatalogSelection = (
  params: MainPageSearchParams,
): CatalogSelection => {
  const notice = params.notice === "end" ? "end" : null

  if (params.mode === undefined) {
    const page = parseBasePage(params.page)
    return {
      mode: "base",
      value: null,
      page,
      fetchProducts: () => fetchProducts(page),
      hasPrevious: page > PRODUCT_PAGE_MIN,
      feedback:
        notice === "end"
          ? { kind: "status", message: "No hay más resultados." }
          : null,
    }
  }

  if (params.mode === "name") {
    const page = parseWidePage(params.page)
    const value = parseModeValue(params.q)
    return {
      mode: "name",
      value,
      page,
      fetchProducts: () => fetchProductsByName(value, page),
      hasPrevious: page > PRODUCT_PAGE_MIN,
      feedback:
        notice === "end"
          ? { kind: "status", message: "No hay más resultados." }
          : null,
    }
  }

  if (params.mode === "category") {
    const page = parseWidePage(params.page)
    const value = parseModeValue(params.category)
    return {
      mode: "category",
      value,
      page,
      fetchProducts: () => fetchProductsByCategory(value, page),
      hasPrevious: page > PRODUCT_PAGE_MIN,
      feedback:
        notice === "end"
          ? { kind: "status", message: "No hay más resultados." }
          : null,
    }
  }

  if (params.mode === "brand") {
    const page = parseWidePage(params.page)
    const value = parseModeValue(params.brand)
    return {
      mode: "brand",
      value,
      page,
      fetchProducts: () => fetchProductsByBrand(value, page),
      hasPrevious: page > PRODUCT_PAGE_MIN,
      feedback:
        notice === "end"
          ? { kind: "status", message: "No hay más resultados." }
          : null,
    }
  }

  return redirectToBase()
}

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
        <main className="p-10 flex flex-col gap-10">
          <h1 className="text-4xl font-bold text-center mb-5">
            Catalogo de productos
          </h1>
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
