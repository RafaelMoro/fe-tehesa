"use client"
import { useState } from "react"
import Link from "next/link"
import { Button, useOverlayState } from "@heroui/react"

import { Product, TaxonomyItem } from "@/shared/types/global.types"
import {
  CategoryPageConfig,
  SUBCATEGORY_LABELS,
} from "@/shared/constants/category.constants"
import { WhatsappPanel } from "@/shared/ui/organisms/WhatsappPanel"
import { ProductListing } from "@/features/ProductListing/ProductListing"
import { SearchInput } from "@/features/ProductListing/SearchInput"
import { DropdownCategories } from "@/features/ProductListing/DropdownCategories"
import { DropdownBrands } from "@/features/ProductListing/DropdownBrands"
import { ProductVariantsDrawer } from "@/features/ProductVariantsDrawer/ProductVariantsDrawer"

const buildOptions = (values: string[]): TaxonomyItem[] =>
  values
    .map((value) => ({
      customId: value,
      name: SUBCATEGORY_LABELS[value] ?? value,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"))

export const CategoryPage = ({
  products,
  config,
}: {
  products: Product[]
  config: CategoryPageConfig
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [subcategory, setSubcategory] = useState<string | null>(null)
  const [brand, setBrand] = useState<string | null>(null)
  const [productDetails, setProductDetails] = useState<Product | null>(null)
  const drawerState = useOverlayState()

  const subcategoryOptions = buildOptions(
    Array.from(
      new Set(
        products
          .map((product) => product.subcategory)
          .filter((value): value is string => Boolean(value)),
      ),
    ),
  )
  const brandOptions: TaxonomyItem[] = Array.from(
    new Set(
      products
        .map((product) => product.brand?.name)
        .filter((value): value is string => Boolean(value)),
    ),
  )
    .map((name) => ({ customId: name, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"))

  const term = searchTerm.trim().toLowerCase()
  const filtered = products.filter((product) => {
    if (term && !product.name.toLowerCase().includes(term)) {
      return false
    }
    if (subcategory && product.subcategory !== subcategory) {
      return false
    }
    if (brand && product.brand?.name !== brand) {
      return false
    }
    return true
  })
  const isFilterActive =
    searchTerm.trim().length > 0 || subcategory !== null || brand !== null
  const counter =
    filtered.length === 1
      ? "1 producto"
      : `${new Intl.NumberFormat("es-MX").format(filtered.length)} productos`

  const clearFilters = () => {
    setSearchTerm("")
    setSubcategory(null)
    setBrand(null)
  }

  const handleProductClick = (product: Product) => {
    setProductDetails(product)
    drawerState.open()
  }

  return (
    <>
      <nav aria-label="Ruta">
        <ol className="flex gap-2 text-sm">
          <li>
            <Link href="/">Inicio</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/categorias">Categorías</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span aria-current="page">{config.name}</span>
          </li>
        </ol>
      </nav>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="text-sm font-semibold text-[#23890C] dark:text-[#4DF527]">
            Categoría
          </p>
          <h1 className="text-[28px] font-bold md:text-4xl lg:text-5xl">
            {config.heading}
          </h1>
          <p className="mt-3 text-muted">{config.intro}</p>
        </div>
        <WhatsappPanel />
      </section>
      <p className="text-sm text-muted">{counter}</p>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <SearchInput
          value={searchTerm}
          onSearch={setSearchTerm}
          placeholder={config.searchPlaceholder}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          {subcategoryOptions.length > 0 && (
            <DropdownCategories
              selectedCategory={subcategory}
              updateSelectedCategory={setSubcategory}
              categories={subcategoryOptions}
              defaultLabel="Filtrar subcategorías"
            />
          )}
          <DropdownBrands
            selectedBrand={brand}
            updateSelectedBrand={setBrand}
            brands={brandOptions}
            defaultLabel="Filtrar marcas"
          />
          {isFilterActive && (
            <Button onPress={clearFilters}>Limpiar filtros</Button>
          )}
        </div>
      </div>
      <ProductListing
        products={filtered}
        handleProductClick={handleProductClick}
        isLocalFilterActive={isFilterActive}
        onClearLocalFilter={clearFilters}
      />
      {productDetails && (
        <ProductVariantsDrawer product={productDetails} state={drawerState} />
      )}
    </>
  )
}
