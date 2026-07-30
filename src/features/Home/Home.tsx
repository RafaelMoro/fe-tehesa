"use client"
import { useState, useRef, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button, Pagination, Popover, useOverlayState } from "@heroui/react"
import { buttonVariants } from "@heroui/styles"
import { RiArrowLeftLine, RiArrowRightLine, RiInformationLine } from "@remixicon/react"

import {
  CatalogMode,
  InitialCatalogFeedback,
  Product,
  TaxonomyItem,
} from "@/shared/types/global.types"
import {
  KNOWN_PRODUCT_TOTAL,
  PRODUCT_PAGE_SIZE,
} from "@/shared/constants/catalog.constants"
import {
  buildBasePagePath,
  buildModeUrl,
} from "@/features/Pagination/utils.pagination"
import { ProductListing } from "../ProductListing/ProductListing"
import { SearchInput } from "../ProductListing/SearchInput"
import { ProductVariantsDrawer } from "../ProductVariantsDrawer/ProductVariantsDrawer"
import { CatalogSearchDrawer } from "../CatalogSearchDrawer/CatalogSearchDrawer"
import { DropdownCategories } from "../ProductListing/DropdownCategories"
import { DropdownBrands } from "../ProductListing/DropdownBrands"
import { useCatalogSearch } from "./useCatalogSearch"
import { CatalogHero } from "./CatalogHero"

type PageFeedback = { message: string; kind: "status" | "error" } | null

const DRAWER_CLOSE_DELAY_MS = 500
const DROPDOWN_CLOSE_DELAY_MS = 250

// ponytail: pagination__link is HeroUI's own slot class (pagination.css); an <a>/<span>
// gets identical styling. Revisit if HeroUI renames it.
const ICON_BUTTON_CLASSES = buttonVariants({
  isIconOnly: true,
  size: "sm",
  variant: "tertiary",
})
const FILTERED_PAGINATION_BUTTON_CLASSES = buttonVariants({
  variant: "secondary",
})

interface HomeProps {
  products: Product[]
  currentPage: number
  totalPages: number
  categories: TaxonomyItem[]
  brands: TaxonomyItem[]
  catalogMode?: CatalogMode
  catalogValue?: string | null
  catalogPage?: number
  hasPreviousCatalogPage?: boolean
  hasNextCatalogPage?: boolean
  initialCatalogFeedback?: InitialCatalogFeedback
}

export const Home = ({
  products,
  currentPage,
  totalPages,
  categories: initialCategories,
  brands: initialBrands,
  catalogMode = "base",
  catalogValue = null,
  catalogPage: initialCatalogPage = 1,
  hasPreviousCatalogPage: initialHasPreviousCatalogPage = false,
  hasNextCatalogPage: initialHasNextCatalogPage = false,
  initialCatalogFeedback = null,
}: HomeProps) => {
  const router = useRouter()
  const [isRoutePending, startRouteTransition] = useTransition()
  const allProducts = useRef<Product[]>(products)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [localCategory, setLocalCategory] = useState<string | null>(null)
  const [localBrand, setLocalBrand] = useState<string | null>(null)
  const isLocalFilterActive =
    localSearchTerm.trim().length > 0 ||
    localCategory !== null ||
    localBrand !== null
  const [categories] = useState<TaxonomyItem[]>(initialCategories)
  const [brands] = useState<TaxonomyItem[]>(initialBrands)
  const [productDetails, setProductDetails] = useState<Product | null>(null)
  const [pageFeedback, setPageFeedback] = useState<PageFeedback>(
    initialCatalogFeedback,
  )
  const activeCatalogMode = catalogMode === "base" ? null : catalogMode
  const selectedCategory = catalogMode === "category" ? catalogValue : null
  const selectedBrand = catalogMode === "brand" ? catalogValue : null
  const isEndNotice =
    initialCatalogFeedback?.message === "No hay más resultados."

  const drawerState = useOverlayState()
  const {
    catalogSearchDrawerState,
    catalogSearchTerm,
    catalogMessage,
    catalogMessageKind,
    invalidSearchMessage,
    isInvalidCatalogSearch,
    isLoadingCatalogSearch,
    handleCatalogSearchTermChange: handleHookSearchTermChange,
    validateCatalogSearchTerm,
    clearCatalogSearchInput,
    clearAllCatalogState,
  } = useCatalogSearch()
  const isBusy = isRoutePending || isLoadingCatalogSearch
  const visibleProductStart =
    products.length === 0 ? 0 : (currentPage - 1) * PRODUCT_PAGE_SIZE + 1
  const visibleProductEnd =
    products.length === 0
      ? 0
      : Math.min(
          (currentPage - 1) * PRODUCT_PAGE_SIZE + products.length,
          KNOWN_PRODUCT_TOTAL,
        )

  const handleCatalogSearchTermChange = (term: string) => {
    handleHookSearchTermChange(term)
    if (pageFeedback) {
      setPageFeedback(null)
    }
  }

  useEffect(() => {
    allProducts.current = products
    setFilteredProducts(products)
    setLocalSearchTerm("")
    setLocalCategory(null)
    setLocalBrand(null)
    setPageFeedback(initialCatalogFeedback)
  }, [initialCatalogFeedback, products])

  const navigateTo = (url: string) => {
    startRouteTransition(() => {
      router.push(url)
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const navigateAfterCatalogDrawerClose = (url: string) => {
    window.setTimeout(() => navigateTo(url), DRAWER_CLOSE_DELAY_MS)
  }

  const closeCatalogDrawerThenNavigate = (url: string) => {
    clearCatalogSearchInput()
    navigateAfterCatalogDrawerClose(url)
  }

  const closeDropdownAndDrawerThenNavigate = (url: string) => {
    window.setTimeout(
      () => closeCatalogDrawerThenNavigate(url),
      DROPDOWN_CLOSE_DELAY_MS,
    )
  }

  // ponytail: stacked local filter; single source of truth = next.{searchTerm,category,brand}.
  const applyLocalFilters = (next: {
    searchTerm: string
    category: string | null
    brand: string | null
  }) => {
    const term = next.searchTerm.trim().toLowerCase()
    const categoryName = next.category
      ? (categories.find((category) => category.customId === next.category)
          ?.name ?? null)
      : null
    const brandName = next.brand
      ? (brands.find((brand) => brand.customId === next.brand)?.name ?? null)
      : null
    const filtered = allProducts.current.filter((prod) => {
      if (term && !prod.name.toLowerCase().includes(term)) {
        return false
      }
      if (categoryName && prod.category?.name !== categoryName) {
        return false
      }
      if (brandName && prod.brand?.name !== brandName) {
        return false
      }
      return true
    })
    setFilteredProducts(filtered)
  }

  const handleSearch = (searchTerm: string) => {
    setLocalSearchTerm(searchTerm)
    applyLocalFilters({
      searchTerm,
      category: localCategory,
      brand: localBrand,
    })
  }

  const handleLocalCategorySelect = (categoryCustomId: string) => {
    setLocalCategory(categoryCustomId)
    applyLocalFilters({
      searchTerm: localSearchTerm,
      category: categoryCustomId,
      brand: localBrand,
    })
  }

  const handleLocalBrandSelect = (brandCustomId: string) => {
    setLocalBrand(brandCustomId)
    applyLocalFilters({
      searchTerm: localSearchTerm,
      category: localCategory,
      brand: brandCustomId,
    })
  }

  const handleCategorySelect = (categoryName: string) => {
    setPageFeedback(null)
    closeDropdownAndDrawerThenNavigate(
      `/?mode=category&category=${encodeURIComponent(categoryName)}&page=1`,
    )
  }

  const handleBrandSelect = (brandName: string) => {
    setPageFeedback(null)
    closeDropdownAndDrawerThenNavigate(
      `/?mode=brand&brand=${encodeURIComponent(brandName)}&page=1`,
    )
  }

  const handleCatalogNameSearchSubmit = () => {
    setPageFeedback(null)
    const trimmed = validateCatalogSearchTerm()
    if (!trimmed) {
      return
    }
    closeCatalogDrawerThenNavigate(
      `/?mode=name&q=${encodeURIComponent(trimmed)}&page=1`,
    )
  }

  const clearLocalFilters = () => {
    setLocalSearchTerm("")
    setLocalCategory(null)
    setLocalBrand(null)
    setFilteredProducts(allProducts.current)
  }

  const clearWideAndLocalFilters = () => {
    setLocalSearchTerm("")
    setLocalCategory(null)
    setLocalBrand(null)
    setPageFeedback(null)
    clearAllCatalogState()
    navigateTo("/?page=1")
  }

  const handleProductClick = (product: Product) => {
    setProductDetails(product)
    drawerState.open()
  }

  return (
    <>
      <CatalogHero
        productCount={products.length}
        onAction={catalogSearchDrawerState.open}
        isDisabled={isBusy}
      />
      <div>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <SearchInput value={localSearchTerm} onSearch={handleSearch} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <DropdownCategories
              selectedCategory={localCategory}
              updateSelectedCategory={handleLocalCategorySelect}
              categories={categories}
              defaultLabel="Filtrar categorías"
            />
            <DropdownBrands
              selectedBrand={localBrand}
              updateSelectedBrand={handleLocalBrandSelect}
              brands={brands}
              defaultLabel="Filtrar marcas"
            />
            {isLocalFilterActive && (
              <Button onPress={clearLocalFilters} isDisabled={isBusy}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
        {isLocalFilterActive && (
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <span>
              Filtrando productos visibles
              {localSearchTerm.trim() && `: "${localSearchTerm}"`}
              {localCategory &&
                ` · ${categories.find((category) => category.customId === localCategory)?.name ?? ""}`}
              {localBrand &&
                ` · ${brands.find((brand) => brand.customId === localBrand)?.name ?? ""}`}
            </span>
            <Popover>
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label="¿Qué significa este filtro?"
              >
                <RiInformationLine />
              </Button>
              <Popover.Content className="max-w-64">
                <Popover.Dialog>
                  <p className="text-sm">
                    Este filtro solo busca en los productos que estás viendo.
                  </p>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-center mb-5">
          {activeCatalogMode !== null && (
            <Button
              variant="tertiary"
              onPress={clearWideAndLocalFilters}
              isDisabled={isBusy}
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
        {pageFeedback && (
          <p
            className="mb-4 text-sm"
            role={pageFeedback.kind === "error" ? "alert" : "status"}
          >
            {pageFeedback.message}
          </p>
        )}
      </div>
      <ProductListing
        products={filteredProducts}
        handleProductClick={handleProductClick}
        isLocalFilterActive={isLocalFilterActive}
        onClearLocalFilter={clearLocalFilters}
        onOpenCatalogSearch={catalogSearchDrawerState.open}
      />
      {activeCatalogMode === null ? (
        <div className="flex flex-col gap-3 rounded-xl border border-default-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Mostrando <span className="font-medium text-foreground">{visibleProductStart}-{visibleProductEnd}</span> de {KNOWN_PRODUCT_TOTAL} productos
          </p>
          <div className="flex items-center justify-center gap-2">
            {currentPage > 1 && !isRoutePending ? (
              <Link
                href={buildBasePagePath(currentPage - 1)}
                aria-label="Página anterior"
                className={ICON_BUTTON_CLASSES}
              >
                <RiArrowLeftLine />
              </Link>
            ) : (
              <span
                aria-label="Página anterior"
                aria-disabled="true"
                className={ICON_BUTTON_CLASSES}
              >
                <RiArrowLeftLine />
              </span>
            )}
            <Pagination size="sm">
              <Pagination.Content>
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1
                  const isActive = page === currentPage
                  const isDisabled = isActive || isRoutePending

                  return (
                    <Pagination.Item key={page}>
                      {isDisabled ? (
                        <span
                          className="pagination__link"
                          data-slot="pagination-link"
                          data-active={isActive ? "true" : undefined}
                          aria-current={isActive ? "page" : undefined}
                          aria-disabled="true"
                        >
                          {page}
                        </span>
                      ) : (
                        <Link
                          href={buildBasePagePath(page)}
                          className="pagination__link"
                          data-slot="pagination-link"
                        >
                          {page}
                        </Link>
                      )}
                    </Pagination.Item>
                  )
                })}
              </Pagination.Content>
            </Pagination>
            {currentPage < totalPages && !isRoutePending ? (
              <Link
                href={buildBasePagePath(currentPage + 1)}
                aria-label="Página siguiente"
                className={ICON_BUTTON_CLASSES}
              >
                <RiArrowRightLine />
              </Link>
            ) : (
              <span
                aria-label="Página siguiente"
                aria-disabled="true"
                className={ICON_BUTTON_CLASSES}
              >
                <RiArrowRightLine />
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center justify-center gap-3">
          {activeCatalogMode && initialHasPreviousCatalogPage && !isBusy ? (
            <Link
              href={buildModeUrl(
                activeCatalogMode,
                catalogValue ?? "",
                initialCatalogPage - 1,
              )}
              className={FILTERED_PAGINATION_BUTTON_CLASSES}
            >
              Anterior
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={FILTERED_PAGINATION_BUTTON_CLASSES}
            >
              Anterior
            </span>
          )}
          <span className="text-sm">Página {initialCatalogPage}</span>
          {activeCatalogMode &&
          initialHasNextCatalogPage &&
          !isEndNotice &&
          !isBusy ? (
            <Link
              href={buildModeUrl(
                activeCatalogMode,
                catalogValue ?? "",
                initialCatalogPage + 1,
              )}
              className={FILTERED_PAGINATION_BUTTON_CLASSES}
            >
              Siguiente
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={FILTERED_PAGINATION_BUTTON_CLASSES}
            >
              Siguiente
            </span>
          )}
        </div>
      )}
      {productDetails && (
        <ProductVariantsDrawer product={productDetails} state={drawerState} />
      )}
      <CatalogSearchDrawer
        state={catalogSearchDrawerState}
        searchTerm={catalogSearchTerm}
        onSearchTermChange={handleCatalogSearchTermChange}
        onSubmit={handleCatalogNameSearchSubmit}
        onCategorySelect={handleCategorySelect}
        onBrandSelect={handleBrandSelect}
        selectedCategory={selectedCategory}
        selectedBrand={selectedBrand}
        categories={categories}
        brands={brands}
        isLoading={isBusy}
        message={catalogMessage}
        messageKind={catalogMessageKind}
        isInvalidSearch={isInvalidCatalogSearch}
        invalidSearchMessage={invalidSearchMessage}
        onClearCatalogSearch={clearWideAndLocalFilters}
      />
    </>
  )
}
