"use client"
import { useState, useRef } from "react"

import { Categories, Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"
import { DropdownCategories } from "../ProductListing/DropdownCategories"

interface HomeProps {
  products: Product[]
}

export const Home = ({ products }: HomeProps) => {
  const allProducts = useRef<Product[]>(products.filter((prod) => prod.available))
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products.filter((prod) => prod.available))
  const [selectedCategory, setSelectedCategory] = useState<Categories | null>(null)

  const updateSelectedCategory = (newCategory: Categories) => {
    setSelectedCategory(newCategory)
    const newFilteredProducts = allProducts.current.filter((prod) => prod.category === newCategory)
    setFilteredProducts(newFilteredProducts)
  }

  return (
    <>
      <div>
        <input type="text" placeholder="Buscar producto" />
        <div className="flex gap-3 items-center mb-5">
          <span>Todos los filtros:</span>
          <DropdownCategories updateSelectedCategory={updateSelectedCategory} />
        </div>
      </div>
      <ProductListing products={filteredProducts} />
    </>
  )
}