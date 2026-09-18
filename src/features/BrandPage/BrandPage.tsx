"use client"
import { useState } from "react"
import Link from "next/link"
import { Button, useOverlayState } from "@heroui/react"

import { Product, TaxonomyItem } from "@/shared/types/global.types"
import { BrandPageConfig } from "@/shared/constants/brand.constants"
import { WhatsappPanel } from "@/shared/ui/organisms/WhatsappPanel"
import { ProductListing } from "@/features/ProductListing/ProductListing"
import { SearchInput } from "@/features/ProductListing/SearchInput"
import { DropdownCategories } from "@/features/ProductListing/DropdownCategories"
import { ProductVariantsDrawer } from "@/features/ProductVariantsDrawer/ProductVariantsDrawer"

export const BrandPage = ({
  products,
  displayName,
  heading,
  config,
}: {
  products: Product[]
  displayName: string
  heading: string
  config: BrandPageConfig
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [productDetails, setProductDetails] = useState<Product | null>(null)
  const drawerState = useOverlayState()

  const categoryOptions: TaxonomyItem[] = Array.from(
    new Set(
      products
        .map((product) => product.category?.name)
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
    if (category && product.category?.name !== category) {
      return false
    }
    return true
  })
  const isFilterActive = searchTerm.trim().length > 0 || category !== null
  const counter =
    filtered.length === 1
      ? "1 producto"
      : `${new Intl.NumberFormat("es-MX").format(filtered.length)} productos`

  const clearFilters = () => {
    setSearchTerm("")
    setCategory(null)
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
            <Link href="/marcas">Marcas</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span aria-current="page">{displayName}</span>
          </li>
        </ol>
      </nav>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="text-sm font-semibold text-[#23890C] dark:text-[#4DF527]">
            Marca
          </p>
          <h1 className="text-[28px] font-bold md:text-4xl lg:text-5xl">
            {heading}
          </h1>
          <p className="mt-3 text-muted">{config.identity}</p>
          <p className="mt-3 text-muted">{config.stock}</p>
        </div>
        <WhatsappPanel />
      </section>
      <p className="text-sm text-muted">{counter}</p>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <SearchInput
          value={searchTerm}
          onSearch={setSearchTerm}
          placeholder={`Buscar en ${displayName}...`}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          {categoryOptions.length >= 2 && (
            <DropdownCategories
              valueKey="name"
              selectedCategory={category}
              updateSelectedCategory={setCategory}
              categories={categoryOptions}
              defaultLabel="Filtrar categorías"
            />
          )}
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
