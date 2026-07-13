"use client"
import { useState, useRef, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button, Pagination, Popover, useOverlayState } from "@heroui/react"
import { RiInformationLine } from "@remixicon/react"

import {
  CatalogMode,
  InitialCatalogFeedback,
  Product,
  TaxonomyItem,
} from "@/shared/types/global.types"
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

  const handlePageChange = (page: number) => {
    if (page === currentPage || isRoutePending) {
      return
    }
    navigateTo(`/?page=${page}`)
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

  const handleCatalogPageChange = (page: number) => {
    if (!activeCatalogMode || !catalogValue || isRoutePending) {
      return
    }
    setPageFeedback(null)
    if (activeCatalogMode === "name") {
      navigateTo(
        `/?mode=name&q=${encodeURIComponent(catalogValue)}&page=${page}`,
      )
    }
    if (activeCatalogMode === "category") {
      navigateTo(
        `/?mode=category&category=${encodeURIComponent(catalogValue)}&page=${page}`,
      )
    }
    if (activeCatalogMode === "brand") {
      navigateTo(
        `/?mode=brand&brand=${encodeURIComponent(catalogValue)}&page=${page}`,
      )
    }
  }

  const handleProductClick = (product: Product) => {
    setProductDetails(product)
    drawerState.open()
  }

  return (
    <>
      <CatalogHero
        productCount={products.length}
        onOpenCatalogSearch={catalogSearchDrawerState.open}
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
        <div className="w-full flex justify-center">
          <Pagination size="md">
            <Pagination.Content>
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1

                return (
                  <Pagination.Item key={page}>
                    <Pagination.Link
                      isActive={page === currentPage}
                      onPress={() => handlePageChange(page)}
                      isDisabled={page === currentPage || isRoutePending}
                    >
                      {page}
                    </Pagination.Link>
                  </Pagination.Item>
                )
              })}
            </Pagination.Content>
          </Pagination>
        </div>
      ) : (
        <div className="w-full flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            onPress={() => handleCatalogPageChange(initialCatalogPage - 1)}
            isDisabled={!initialHasPreviousCatalogPage || isBusy}
          >
            Anterior
          </Button>
          <span className="text-sm">Página {initialCatalogPage}</span>
          <Button
            variant="secondary"
            onPress={() => handleCatalogPageChange(initialCatalogPage + 1)}
            isDisabled={!initialHasNextCatalogPage || isEndNotice || isBusy}
          >
            Siguiente
          </Button>
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
