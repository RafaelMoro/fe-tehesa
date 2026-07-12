import { Button } from "@heroui/react"

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
      <div className="flex flex-col gap-2">
        <p>No hay coincidencias en los productos que estás viendo.</p>
        <p>
          ¿No encontraste lo que buscabas? Amplía la búsqueda al catálogo
          completo.
        </p>
        <div className="flex flex-wrap gap-2">
          {onOpenCatalogSearch && (
            <Button size="sm" variant="primary" onPress={onOpenCatalogSearch}>
              Buscar en todo el catálogo
            </Button>
          )}
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
