"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, Pagination, useOverlayState } from "@heroui/react"

import { Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"
import { SearchInput } from "../ProductListing/SearchInput"
import { ProductVariantsDrawer } from "../ProductVariantsDrawer/ProductVariantsDrawer"
import { DropdownCategories } from "../ProductListing/DropdownCategories"
import { DropdownBrands } from "../ProductListing/DropdownBrands"
import { fetchProductsByCategory, fetchProductsByBrand } from "@/shared/lib/global.lib"

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
    // Reset category and brand filters when page changes
    setSelectedCategory(null);
    setSelectedBrand(null);
  }, [products]);

  // Handle pagination - navigate to new page
  const handlePageChange = (page: number) => {
    router.push(`/?page=${page}`);
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      // If search is empty, show all products from current page
      setFilteredProducts(allProducts.current);
      return;
    }

    // Filter by search term in product name (case-insensitive)
    // Only filters the 50 products on the current page
    const searchFiltered = allProducts.current.filter((prod) => 
      prod.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredProducts(searchFiltered);
    // Note: Does NOT reset to page 1
  }

  const handleCategorySelect = async (categoryCustomId: string) => {
    try {
      setIsLoadingCategory(true);
      const categoryProducts = await fetchProductsByCategory(categoryCustomId);
      
      if (categoryProducts) {
        allProducts.current = categoryProducts;
        setFilteredProducts(categoryProducts);
        setSelectedCategory(categoryCustomId);
        // Reset brand filter when category is selected
        setSelectedBrand(null);
      }
    } catch (error) {
      console.error('Error fetching products by category:', error);
    } finally {
      setIsLoadingCategory(false);
    }
  }

  const handleBrandSelect = async (brandCustomId: string) => {
    try {
      setIsLoadingBrand(true);
      const brandProducts = await fetchProductsByBrand(brandCustomId);
      
      if (brandProducts) {
        allProducts.current = brandProducts;
        setFilteredProducts(brandProducts);
        setSelectedBrand(brandCustomId);
        // Reset category filter when brand is selected
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Error fetching products by brand:', error);
    } finally {
      setIsLoadingBrand(false);
    }
  }

  const clearFilters = () => {
    setFilteredProducts(products);
    allProducts.current = products;
    setSelectedCategory(null);
    setSelectedBrand(null);
    // Shows all 50 products from current page
  }

  const handleProductClick = (product: Product) => {
    setProductDetails(product)
    drawerState.open()
  }

  return (
    <>
      <div>
        <SearchInput onSearch={handleSearch} />
        <div className="flex gap-3 items-center mb-5">
          <DropdownCategories selectedCategory={selectedCategory} updateSelectedCategory={handleCategorySelect} />
          <DropdownBrands selectedBrand={selectedBrand} updateSelectedBrand={handleBrandSelect} />
          <Button onPress={clearFilters} isDisabled={isLoadingCategory || isLoadingBrand}>Limpiar filtros</Button>
        </div>
      </div>
      <ProductListing products={filteredProducts} handleProductClick={handleProductClick} />
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
