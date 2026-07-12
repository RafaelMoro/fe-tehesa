"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, Pagination, Popover, useOverlayState } from "@heroui/react"
import { RiInformationLine } from "@remixicon/react"

import { BRANDS_PRODUCTS, CATEGORIES_PRODUCTS, Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"
import { SearchInput } from "../ProductListing/SearchInput"
import { ProductVariantsDrawer } from "../ProductVariantsDrawer/ProductVariantsDrawer"
import { CatalogSearchDrawer } from "../CatalogSearchDrawer/CatalogSearchDrawer"
import { DropdownCategories } from "../ProductListing/DropdownCategories"
import { DropdownBrands } from "../ProductListing/DropdownBrands"
import { catalogErrorToSpanish, fetchCatalog } from "@/shared/utils/catalog-api.utils"

interface HomeProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
}

type CatalogMode = 'name' | 'category' | 'brand' | null

export const Home = ({
  products,
  currentPage,
  totalPages
}: HomeProps) => {
  const router = useRouter();
  const allProducts = useRef<Product[]>(products)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [localCategory, setLocalCategory] = useState<string | null>(null)
  const [localBrand, setLocalBrand] = useState<string | null>(null)
  const isLocalFilterActive =
    localSearchTerm.trim().length > 0 ||
    localCategory !== null ||
    localBrand !== null
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoadingCategory, setIsLoadingCategory] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [isLoadingBrand, setIsLoadingBrand] = useState(false)
  const [activeCatalogMode, setActiveCatalogMode] = useState<CatalogMode>(null)
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("")
  const [catalogMessage, setCatalogMessage] = useState<string | undefined>(undefined)
  const [isInvalidCatalogSearch, setIsInvalidCatalogSearch] = useState(false)
  const [isLoadingCatalogSearch, setIsLoadingCatalogSearch] = useState(false)
  // State to open the drawer and get variants
  const [productDetails, setProductDetails] = useState<Product | null>(null)

  const drawerState = useOverlayState();
  const catalogSearchDrawerState = useOverlayState();

  // Update products when page changes (new products fetched from server)
  useEffect(() => {
    allProducts.current = products;
    setFilteredProducts(products);
    // Reset catalog-wide and local filters when page changes
    setSelectedCategory(null);
    setSelectedBrand(null);
    setLocalSearchTerm("");
    setLocalCategory(null);
    setLocalBrand(null);
    setActiveCatalogMode(null);
    setCatalogSearchTerm("");
    setCatalogMessage(undefined);
    setIsInvalidCatalogSearch(false);
    setIsLoadingCatalogSearch(false);
  }, [products]);

  // Handle pagination - navigate to new page
  const handlePageChange = (page: number) => {
    router.push(`/?page=${page}`);
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ponytail: stacked local filter; single source of truth = next.{searchTerm,category,brand}.
  const applyLocalFilters = (next: { searchTerm: string; category: string | null; brand: string | null }) => {
    const term = next.searchTerm.trim().toLowerCase();
    const categoryName = next.category
      ? CATEGORIES_PRODUCTS.find((c) => c.customId === next.category)?.name ?? null
      : null;
    const brandName = next.brand
      ? BRANDS_PRODUCTS.find((b) => b.customId === next.brand)?.name ?? null
      : null;
    const filtered = allProducts.current.filter((prod) => {
      if (term && !prod.name.toLowerCase().includes(term)) return false;
      if (categoryName && prod.category?.name !== categoryName) return false;
      if (brandName && prod.brand?.name !== brandName) return false;
      return true;
    });
    setFilteredProducts(filtered);
  }

  const handleSearch = (searchTerm: string) => {
    setLocalSearchTerm(searchTerm);
    applyLocalFilters({ searchTerm, category: localCategory, brand: localBrand });
  }

  const handleLocalCategorySelect = (categoryCustomId: string) => {
    setLocalCategory(categoryCustomId);
    applyLocalFilters({ searchTerm: localSearchTerm, category: categoryCustomId, brand: localBrand });
  }

  const handleLocalBrandSelect = (brandCustomId: string) => {
    setLocalBrand(brandCustomId);
    applyLocalFilters({ searchTerm: localSearchTerm, category: localCategory, brand: brandCustomId });
  }

  const handleCategorySelect = async (categoryCustomId: string) => {
    catalogSearchDrawerState.close();
    try {
      setIsLoadingCategory(true);
      const categoryProducts = await fetchCatalog<Product[]>(
        `/api/catalog/category?categoryId=${encodeURIComponent(categoryCustomId)}`,
      );
      allProducts.current = categoryProducts;
      setFilteredProducts(categoryProducts);
      setSelectedCategory(categoryCustomId);
      setActiveCatalogMode('category');
      setSelectedBrand(null);
      setCatalogSearchTerm("");
      setCatalogMessage(undefined);
      setIsInvalidCatalogSearch(false);
      // Reset local filters when a catalog-wide category is selected
      setLocalSearchTerm("");
      setLocalCategory(null);
      setLocalBrand(null);
    } catch (error) {
      const code = (error as { code?: string })?.code
      console.error('Error fetching products by category:', code ? catalogErrorToSpanish(code) : error);
    } finally {
      setIsLoadingCategory(false);
    }
  }

  const handleBrandSelect = async (brandCustomId: string) => {
    catalogSearchDrawerState.close();
    try {
      setIsLoadingBrand(true);
      const brandProducts = await fetchCatalog<Product[]>(
        `/api/catalog/brand?brandId=${encodeURIComponent(brandCustomId)}`,
      );
      allProducts.current = brandProducts;
      setFilteredProducts(brandProducts);
      setSelectedBrand(brandCustomId);
      setActiveCatalogMode('brand');
      setSelectedCategory(null);
      setCatalogSearchTerm("");
      setCatalogMessage(undefined);
      setIsInvalidCatalogSearch(false);
      // Reset local filters when a catalog-wide brand is selected
      setLocalSearchTerm("");
      setLocalCategory(null);
      setLocalBrand(null);
    } catch (error) {
      const code = (error as { code?: string })?.code
      console.error('Error fetching products by brand:', code ? catalogErrorToSpanish(code) : error);
    } finally {
      setIsLoadingBrand(false);
    }
  }

  const handleCatalogSearchTermChange = (term: string) => {
    setCatalogSearchTerm(term);
    if (isInvalidCatalogSearch) {
      setIsInvalidCatalogSearch(false);
    }
    if (catalogMessage) {
      setCatalogMessage(undefined);
    }
  }

  const handleCatalogNameSearch = async () => {
    const trimmed = catalogSearchTerm.trim();
    if (trimmed.length === 0) {
      setIsInvalidCatalogSearch(true);
      setCatalogMessage("Revisa el texto de búsqueda e inténtalo de nuevo.");
      return;
    }
    setIsLoadingCatalogSearch(true);
    setIsInvalidCatalogSearch(false);
    setCatalogMessage("Buscando productos en el catálogo...");
    try {
      const products = await fetchCatalog<Product[]>(
        `/api/catalog/search?q=${encodeURIComponent(trimmed)}`,
      );
      allProducts.current = products;
      setFilteredProducts(products);
      setActiveCatalogMode('name');
      setSelectedCategory(null);
      setSelectedBrand(null);
      setLocalSearchTerm("");
      setLocalCategory(null);
      setLocalBrand(null);
      setCatalogMessage(products.length === 0 ? "No encontramos productos en el catálogo." : undefined);
      catalogSearchDrawerState.close();
    } catch (error) {
      const code = (error as { code?: string })?.code
      if (code === 'CAT_VAL_006') {
        setIsInvalidCatalogSearch(true);
        setCatalogMessage("Revisa el texto de búsqueda e inténtalo de nuevo.");
      } else {
        setCatalogMessage(
          code
            ? catalogErrorToSpanish(code)
            : "No pudimos buscar productos. Inténtalo de nuevo.",
        );
      }
    } finally {
      setIsLoadingCatalogSearch(false);
    }
  }

  const clearFilters = () => {
    // Local-only clear per Story 1b; does not touch catalog-wide state.
    setLocalSearchTerm("");
    setLocalCategory(null);
    setLocalBrand(null);
    setFilteredProducts(allProducts.current);
  }

  const clearAllFilters = () => {
    setLocalSearchTerm("");
    setLocalCategory(null);
    setLocalBrand(null);
    setSelectedCategory(null);
    setSelectedBrand(null);
    setActiveCatalogMode(null);
    setCatalogSearchTerm("");
    setCatalogMessage(undefined);
    setIsInvalidCatalogSearch(false);
    setIsLoadingCatalogSearch(false);
    allProducts.current = products;
    setFilteredProducts(products);
    catalogSearchDrawerState.close();
  }

  const handleProductClick = (product: Product) => {
    setProductDetails(product)
    drawerState.open()
  }

  return (
    <>
      <div>
        <SearchInput value={localSearchTerm} onSearch={handleSearch} />
        <div className="flex flex-wrap gap-3 items-center mb-3">
          <DropdownCategories
            selectedCategory={localCategory}
            updateSelectedCategory={handleLocalCategorySelect}
            defaultLabel="Filtrar por categoría visible"
          />
          <DropdownBrands
            selectedBrand={localBrand}
            updateSelectedBrand={handleLocalBrandSelect}
            defaultLabel="Filtrar por marca visible"
          />
          <Button onPress={clearFilters} isDisabled={isLoadingCategory || isLoadingBrand}>
            Limpiar filtros
          </Button>
        </div>
        {isLocalFilterActive && (
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <span>
              Filtrando productos visibles
              {localSearchTerm.trim() && `: "${localSearchTerm}"`}
              {localCategory && ` · ${CATEGORIES_PRODUCTS.find((c) => c.customId === localCategory)?.name ?? ''}`}
              {localBrand && ` · ${BRANDS_PRODUCTS.find((b) => b.customId === localBrand)?.name ?? ''}`}
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
                  <p className="text-sm">Este filtro solo busca en los productos que estás viendo.</p>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-center mb-5">
          <Button
            variant="secondary"
            onPress={catalogSearchDrawerState.open}
            isDisabled={isLoadingCategory || isLoadingBrand || isLoadingCatalogSearch}
          >
            Buscar en todo el catálogo
          </Button>
        </div>
      </div>
      <ProductListing
        products={filteredProducts}
        handleProductClick={handleProductClick}
        isLocalFilterActive={isLocalFilterActive}
        onClearLocalFilter={clearFilters}
      />
      {activeCatalogMode === null && (
        <div className="w-full flex justify-center">
          <Pagination size="md">
            <Pagination.Content>
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1

                return (
                  <Pagination.Item key={page}>
                    <Pagination.Link isActive={page === currentPage} onPress={() => handlePageChange(page)}>
                      {page}
                    </Pagination.Link>
                  </Pagination.Item>
                )
              })}
            </Pagination.Content>
          </Pagination>
        </div>
      )}
      { productDetails && (
        <ProductVariantsDrawer product={productDetails} state={drawerState} />
      )}
      <CatalogSearchDrawer
        state={catalogSearchDrawerState}
        searchTerm={catalogSearchTerm}
        onSearchTermChange={handleCatalogSearchTermChange}
        onSubmit={handleCatalogNameSearch}
        onCategorySelect={handleCategorySelect}
        onBrandSelect={handleBrandSelect}
        selectedCategory={selectedCategory}
        selectedBrand={selectedBrand}
        isLoading={isLoadingCatalogSearch}
        message={catalogMessage}
        isInvalidSearch={isInvalidCatalogSearch}
        onClearCatalogSearch={clearAllFilters}
      />
    </>
  )
}
