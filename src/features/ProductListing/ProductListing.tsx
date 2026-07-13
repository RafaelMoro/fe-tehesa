import { Button } from "@heroui/react"
import { RiArrowRightLine, RiSearchLine } from "@remixicon/react"

import { ProductCard } from "@/components/ProductCard"
import { Product } from "@/shared/types/global.types"

interface ProductListingProps {
  products: Product[]
  handleProductClick: (product: Product) => void
  isLocalFilterActive: boolean
  onClearLocalFilter?: () => void
  onOpenCatalogSearch?: () => void
}

export const ProductListing = ({
  products,
  handleProductClick,
  isLocalFilterActive,
  onClearLocalFilter,
  onOpenCatalogSearch,
}: ProductListingProps) => {
  if (products.length === 0 && isLocalFilterActive) {
    return (
      <div className="flex min-h-102 flex-col items-center justify-center rounded-xl border border-default-200 bg-gradient-to-b from-gray-50 to-transparent px-6 py-14 text-center">
        <div className="mb-6 flex size-13 items-center justify-center rounded-full border border-default-200 bg-surface text-muted">
          <RiSearchLine aria-hidden="true" size={22} />
        </div>
        <h2 className="text-2xl font-bold">
          No hay coincidencias en estos productos
        </h2>
        <p className="mt-3 max-w-md text-muted">
          No encontramos resultados en la selección que estás viendo. Podemos
          ampliar la búsqueda sin perder tus filtros.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          {onOpenCatalogSearch && (
            <Button size="lg" variant="primary" onPress={onOpenCatalogSearch}>
              Buscar en todo el catálogo
              <RiArrowRightLine aria-hidden="true" />
            </Button>
          )}
          <p className="text-xs text-muted mt-8">
            La búsqueda incluirá productos fuera de la selección actual.
          </p>
          {onClearLocalFilter && (
            <Button size="sm" variant="tertiary" onPress={onClearLocalFilter}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return <div>No hay productos disponibles.</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.documentId}
          product={product}
          handleProductClick={handleProductClick}
        />
      ))}
    </div>
  )
}
