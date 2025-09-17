"use client"
import { useState } from "react"

import { Categories, Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"
import { DropdownCategories } from "../ProductListing/DropdownCategories"

interface HomeProps {
  products: Product[]
}

export const Home = ({ products }: HomeProps) => {
  const [currentProducts, setCurrentProducts] = useState(products.filter((prod) => prod.available))
  const [selectedCategory, setSelectedCategory] = useState<Categories | null>(null)
  console.log('selectedCategory', selectedCategory)
  const updateSelectedCategory = (newCategory: Categories) => setSelectedCategory(newCategory)

  return (
    <>
      <div>
        <input type="text" placeholder="Buscar producto" />
        <div className="flex gap-3 items-center">
          <span>Todos los filtros:</span>
          <DropdownCategories updateSelectedCategory={updateSelectedCategory} />
        </div>
      </div>
      <ProductListing products={currentProducts} />
    </>
  )
}