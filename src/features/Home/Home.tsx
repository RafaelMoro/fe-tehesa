"use client"
import { useState, useRef } from "react"

import { CategoriesList, Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"
import { DropdownCategories } from "../ProductListing/DropdownCategories"
import { SearchInput } from "../ProductListing/SearchInput"
import { Button } from "@heroui/react"

interface HomeProps {
  products: Product[]
}

export const Home = ({ products }: HomeProps) => {
  const allProducts = useRef<Product[]>(products.filter((prod) => prod.available))
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products.filter((prod) => prod.available))
  const [selectedCategory, setSelectedCategory] = useState<CategoriesList | null>(null)

  const updateSelectedCategory = (newCategory: CategoriesList) => {
    setSelectedCategory(newCategory)
    // const newFilteredProducts = allProducts.current.filter((prod) => prod.category === newCategory)
    // TODO: Change this
    setFilteredProducts(allProducts.current)
  }

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      // If search is empty, show all products or filtered by category
      if (selectedCategory) {
        // const categoryFiltered = allProducts.current.filter((prod) => prod.category === selectedCategory)
        // TODO: Change this
        setFilteredProducts(allProducts.current)
      } else {
        setFilteredProducts(allProducts.current)
      }
      return
    }

    // Filter by search term in product name (case-insensitive)
    let searchFiltered = allProducts.current.filter((prod) => 
      prod.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // If there's also a selected category, apply both filters
    if (selectedCategory) {
      // searchFiltered = searchFiltered.filter((prod) => prod.category === selectedCategory)
    }

    setFilteredProducts(searchFiltered)
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setFilteredProducts(allProducts.current)
  }

  return (
    <>
      <div>
        <SearchInput onSearch={handleSearch} />
        <div className="flex gap-3 items-center mb-5">
          <span>Todos los filtros:</span>
          <Button onClick={clearFilters}>Limpiar filtros</Button>
          <DropdownCategories updateSelectedCategory={updateSelectedCategory} />
        </div>
      </div>
      <ProductListing products={filteredProducts} />
    </>
  )
}