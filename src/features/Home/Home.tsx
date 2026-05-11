"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, Pagination, useDisclosure } from "@heroui/react"

import { Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"
import { SearchInput } from "../ProductListing/SearchInput"
import { ProductVariantsDrawer } from "../ProductVariantsDrawer/ProductVariantsDrawer"

interface HomeProps {
  products: Product[];
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: number;
}

export const Home = ({ 
  products,
  currentPage,
  hasNextPage,
  hasPrevPage,
  totalPages 
}: HomeProps) => {
  const router = useRouter();
  const allProducts = useRef<Product[]>(products)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  // State to open the drawer and get variants
  const [productDetails, setProductDetails] = useState<Product | null>(null)

  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  // Update products when page changes (new products fetched from server)
  useEffect(() => {
    allProducts.current = products;
    setFilteredProducts(products);
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

  const clearFilters = () => {
    setFilteredProducts(allProducts.current);
    // Shows all 50 products from current page
  }

  const handleProductClick = (product: Product) => {
    setProductDetails(product)
    onOpen()
  }

  return (
    <>
      <div>
        <SearchInput onSearch={handleSearch} />
        <div className="flex gap-3 items-center mb-5">
          <Button onPress={clearFilters}>Limpiar filtros</Button>
        </div>
      </div>
      <ProductListing products={filteredProducts} handleProductClick={handleProductClick} />
      <div className="w-full flex justify-center">
        <Pagination 
          page={currentPage}
          total={totalPages}
          onChange={handlePageChange}
          size="md" 
        />
      </div>
      { productDetails && (
        <ProductVariantsDrawer product={productDetails} isOpen={isOpen} onOpenChange={onOpenChange} />
      )}
    </>
  )
}