"use client"
import { useState } from "react"

import { Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"

interface HomeProps {
  products: Product[]
}

export const Home = ({ products }: HomeProps) => {
  const [currentProducts, setCurrentProducts] = useState(products.filter((prod) => prod.available))

  return (
    <>
      <div>
        <input type="text" placeholder="Buscar producto" />
        <div>
          <span>Todos los filtros:</span>
          <input type="text" placeholder="Dropdown para buscar por categoria" />
        </div>
      </div>
      <ProductListing products={currentProducts} />
    </>
  )
}