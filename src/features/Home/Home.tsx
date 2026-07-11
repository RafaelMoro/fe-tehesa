"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, Pagination, Popover, useOverlayState } from "@heroui/react"
import { RiInformationLine } from "@remixicon/react"

import { Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"
import { SearchInput } from "../ProductListing/SearchInput"
import { ProductVariantsDrawer } from "../ProductVariantsDrawer/ProductVariantsDrawer"
import { DropdownCategories } from "../ProductListing/DropdownCategories"
import { DropdownBrands } from "../ProductListing/DropdownBrands"
import { catalogErrorToSpanish, fetchCatalog } from "@/shared/utils/catalog-api.utils"

interface HomeProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
}

export const Home = ({ 
  products,
  currentPage,
  totalPages 
}: HomeProps) => {
  const router = useRouter();
  const allProducts = useRef<Product[]>(products)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const isLocalFilterActive = localSearchTerm.trim().length > 0
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoadingCategory, setIsLoadingCategory] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [isLoadingBrand, setIsLoadingBrand] = useState(false)
  // State to open the drawer and get variants
  const [productDetails, setProductDetails] = useState<Product | null>(null)

  const drawerState = useOverlayState();

  // Update products when page changes (new products fetched from server)
  useEffect(() => {
    allProducts.current = products;
    setFilteredProducts(products);
    // Reset category, brand, and local filter when page changes
    setSelectedCategory(null);
    setSelectedBrand(null);
    setLocalSearchTerm("");
  }, [products]);

  // Handle pagination - navigate to new page
  const handlePageChange = (page: number) => {
    router.push(`/?page=${page}`);
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (searchTerm: string) => {
    setLocalSearchTerm(searchTerm);
    if (!searchTerm.trim()) {
      // If search is empty, show the current working set
      setFilteredProducts(allProducts.current);
      return;
    }

    // Filter by search term in product name (case-insensitive)
    // Only filters the current working set (page, category-wide, or brand-wide)
    const searchFiltered = allProducts.current.filter((prod) =>
      prod.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredProducts(searchFiltered);
    // Note: Does NOT reset to page 1
  }

  const handleCategorySelect = async (categoryCustomId: string) => {
    try {
      setIsLoadingCategory(true);
      const categoryProducts = await fetchCatalog<Product[]>(
        `/api/catalog/category?categoryId=${encodeURIComponent(categoryCustomId)}`,
      );
      allProducts.current = categoryProducts;
      setFilteredProducts(categoryProducts);
      setSelectedCategory(categoryCustomId);
      // Reset brand filter and local filter when category is selected
      setSelectedBrand(null);
      setLocalSearchTerm("");
    } catch (error) {
      const code = (error as { code?: string })?.code
      console.error('Error fetching products by category:', code ? catalogErrorToSpanish(code) : error);
    } finally {
      setIsLoadingCategory(false);
    }
  }

  const handleBrandSelect = async (brandCustomId: string) => {
    try {
      setIsLoadingBrand(true);
      const brandProducts = await fetchCatalog<Product[]>(
        `/api/catalog/brand?brandId=${encodeURIComponent(brandCustomId)}`,
      );
      allProducts.current = brandProducts;
      setFilteredProducts(brandProducts);
      setSelectedBrand(brandCustomId);
      // Reset category filter and local filter when brand is selected
      setSelectedCategory(null);
      setLocalSearchTerm("");
    } catch (error) {
      const code = (error as { code?: string })?.code
      console.error('Error fetching products by brand:', code ? catalogErrorToSpanish(code) : error);
    } finally {
      setIsLoadingBrand(false);
    }
  }

  const clearLocalFilter = () => {
    setLocalSearchTerm("");
    setFilteredProducts(allProducts.current);
  }

  const clearFilters = () => {
    setFilteredProducts(products);
    allProducts.current = products;
    setSelectedCategory(null);
    setSelectedBrand(null);
    setLocalSearchTerm("");
    // Shows all 50 products from current page
  }

  const handleProductClick = (product: Product) => {
    setProductDetails(product)
    drawerState.open()
  }

  return (
    <>
      <div>
        <SearchInput value={localSearchTerm} onSearch={handleSearch} />
        {isLocalFilterActive && (
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <span>Filtrando productos visibles por: &quot;{localSearchTerm}&quot;</span>
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
            <Button size="sm" variant="tertiary" onPress={clearLocalFilter}>
              Limpiar filtro local
            </Button>
          </div>
        )}
        <div className="flex gap-3 items-center mb-5">
          <DropdownCategories selectedCategory={selectedCategory} updateSelectedCategory={handleCategorySelect} />
          <DropdownBrands selectedBrand={selectedBrand} updateSelectedBrand={handleBrandSelect} />
          <Button onPress={clearFilters} isDisabled={isLoadingCategory || isLoadingBrand}>Limpiar filtros</Button>
        </div>
      </div>
      <ProductListing
        products={filteredProducts}
        handleProductClick={handleProductClick}
        isLocalFilterActive={isLocalFilterActive}
        onClearLocalFilter={clearLocalFilter}
      />
      {selectedCategory === null && selectedBrand === null && (
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
    </>
  )
}
