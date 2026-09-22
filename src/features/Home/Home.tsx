"use client"
import { useState, useRef, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button, Pagination, Popover, useOverlayState } from "@heroui/react"
import { buttonVariants } from "@heroui/styles"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiInformationLine,
} from "@remixicon/react"

import {
  CatalogMode,
  InitialCatalogFeedback,
  Product,
  TaxonomyItem,
} from "@/shared/types/global.types"
import {
  CATALOG_SEARCH_OPEN_EVENT,
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
import { HomeQuotePanel } from "./HomeQuotePanel"
import { BrandStrip } from "./BrandStrip"

type PageFeedback = { message: string; kind: "status" | "error" } | null

const DRAWER_CLOSE_DELAY_MS = 500
const DROPDOWN_CLOSE_DELAY_MS = 250

// ponytail: pagination__link is HeroUI's own slot class (pagination.css); an <a>/<span>
// gets identical styling. Revisit if HeroUI renames it.
const PAGE_NAV_BUTTON_CLASSES =
  buttonVariants({ variant: "outline", size: "md" }) +
  " min-h-11 lg:min-h-10 min-w-0 px-3 lg:px-4 rounded-[10px] border-default-300"
const PAGE_NAV_NEXT_BUTTON_CLASSES =
  PAGE_NAV_BUTTON_CLASSES + " max-lg:border-default-400 max-lg:font-semibold"
const FILTERED_PAGINATION_BUTTON_CLASSES = buttonVariants({
  variant: "secondary",
})
const countFormatter = new Intl.NumberFormat("es-MX")

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

  useEffect(() => {
    const open = () => catalogSearchDrawerState.open()
    window.addEventListener(CATALOG_SEARCH_OPEN_EVENT, open)
    return () => window.removeEventListener(CATALOG_SEARCH_OPEN_EVENT, open)
  }, [catalogSearchDrawerState])

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

  const trimmedLocalTerm = localSearchTerm.trim()
  const hasNoLocalMatches = isLocalFilterActive && filteredProducts.length === 0

  return (
    <>
      <CatalogHero
        productCount={products.length}
        statusText={
          catalogMode === "base"
            ? `${countFormatter.format(KNOWN_PRODUCT_TOTAL)} productos en catálogo`
            : undefined
        }
        onAction={catalogSearchDrawerState.open}
        isDisabled={isBusy}
      />
      <BrandStrip brands={brands} />
      <div>
        <div className="mb-5 flex flex-col gap-3 border-t border-default-200 pt-5 dark:border-[#1E3608] lg:flex-row">
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
        {!isLocalFilterActive && (
          <p className="mb-3 text-sm text-muted">
            Escribe el nombre del producto. Ejemplo: broca cobalto, machuelo
            NPT, dado de impacto.
          </p>
        )}
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
                    Filtra solo entre los productos que estás viendo. Puedes
                    combinar categoría, marca y texto.
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
      {hasNoLocalMatches ? (
        <div className="flex flex-col items-start gap-4" role="status">
          <p className="max-w-2xl text-muted">
            {trimmedLocalTerm
              ? `Nada con "${trimmedLocalTerm}". Prueba con otra palabra del nombre (broca, machuelo, dado) o mándanos la clave o la medida por WhatsApp.`
              : "Ninguno de los productos que estás viendo coincide. Quita un filtro o busca en todo el catálogo."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onPress={catalogSearchDrawerState.open}
              isDisabled={isBusy}
            >
              Buscar en todo el catálogo
              <RiArrowRightLine aria-hidden="true" />
            </Button>
            <Button
              variant="tertiary"
              onPress={clearLocalFilters}
              isDisabled={isBusy}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      ) : (
        <ProductListing
          products={filteredProducts}
          handleProductClick={handleProductClick}
          isLocalFilterActive={isLocalFilterActive}
        />
      )}
      {activeCatalogMode === null ? (
        <div className="flex flex-col gap-3 rounded-xl border border-default-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1 text-center lg:text-left">
            <p className="text-sm text-muted">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {visibleProductStart}-{visibleProductEnd}
              </span>{" "}
              de {KNOWN_PRODUCT_TOTAL} productos
            </p>
            {currentPage === totalPages && !isRoutePending && (
              <p className="text-sm text-muted">
                Llegaste al final de esta lista. Cambia el filtro o busca en
                todo el catálogo.
              </p>
            )}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 lg:flex lg:justify-center">
            {currentPage > 1 && !isRoutePending ? (
              <Link
                href={buildBasePagePath(currentPage - 1)}
                aria-label="Página anterior"
                className={PAGE_NAV_BUTTON_CLASSES}
              >
                <RiArrowLeftLine aria-hidden="true" size={16} />
                <span className="lg:hidden">Anterior</span>
                <span className="hidden lg:inline">Página anterior</span>
              </Link>
            ) : (
              <span
                aria-label="Página anterior"
                aria-disabled="true"
                className={PAGE_NAV_BUTTON_CLASSES}
              >
                <RiArrowLeftLine aria-hidden="true" size={16} />
                <span className="lg:hidden">Anterior</span>
                <span className="hidden lg:inline">Página anterior</span>
              </span>
            )}
            <Pagination size="sm" className="hidden lg:flex">
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
            <span className="whitespace-nowrap text-[13px] text-muted lg:hidden">
              Página{" "}
              <strong className="font-semibold text-foreground">
                {currentPage}
              </strong>{" "}
              de {totalPages}
            </span>
            {currentPage < totalPages && !isRoutePending ? (
              <Link
                href={buildBasePagePath(currentPage + 1)}
                aria-label="Página siguiente"
                className={PAGE_NAV_NEXT_BUTTON_CLASSES}
              >
                <span className="lg:hidden">Siguiente</span>
                <span className="hidden lg:inline">Página siguiente</span>
                <RiArrowRightLine aria-hidden="true" size={16} />
              </Link>
            ) : (
              <span
                aria-label="Página siguiente"
                aria-disabled="true"
                className={PAGE_NAV_NEXT_BUTTON_CLASSES}
              >
                <span className="lg:hidden">Siguiente</span>
                <span className="hidden lg:inline">Página siguiente</span>
                <RiArrowRightLine aria-hidden="true" size={16} />
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {(!initialHasNextCatalogPage || isEndNotice) && !isBusy && (
            <p className="text-sm text-muted">
              Llegaste al final de esta lista. Cambia el filtro o busca en
              todo el catálogo.
            </p>
          )}
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
        </div>
      )}
      <HomeQuotePanel />
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
