"use client"
import { Button, Card } from "@heroui/react"

import { Product } from "@/shared/types/global.types"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"

interface ProductCardProps {
  product: Product
  handleProductClick: (product: Product) => void
}

export const ProductCard = ({
  product,
  handleProductClick,
}: ProductCardProps) => {
  const internalId = product.product_variants?.[0]?.internalId
  const productType = [product.category?.name, product.brand?.name]
    .filter(Boolean)
    .join(" / ")
  const minPriceString =
    product.minPrice == null ? null : formatNumberToCurrency(product.minPrice)
  const maxPriceString =
    product.maxPrice == null ? null : formatNumberToCurrency(product.maxPrice)
  const primaryButtonText =
    product.variantCount != null
      ? `Explorar las ${product.variantCount} variantes`
      : "Ver variantes"

  return (
    <Card className="h-full gap-0 overflow-hidden">
      <Card.Header className="flex flex-col gap-1 px-5 pt-5 pb-4">
        {productType && (
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
            {productType}
          </p>
        )}
        <Card.Title className="text-xl font-bold sm:text-2xl">
          {product.name}
        </Card.Title>
        {internalId && <Card.Description>Modelo {internalId}</Card.Description>}
      </Card.Header>
      <Card.Content className="border-t border-default-200 px-5 py-4">
        {minPriceString && maxPriceString && (
          <div className="grid grid-cols-2 divide-x divide-default-200">
            <div className="flex flex-col gap-1 pr-4">
              <span className="text-xs text-muted uppercase">Desde</span>
              <span className="text-xl font-bold">{minPriceString}</span>
            </div>
            <div className="flex flex-col gap-1 pl-4">
              <span className="text-xs text-muted uppercase">Hasta</span>
              <span className="text-xl font-bold">{maxPriceString}</span>
            </div>
          </div>
        )}
      </Card.Content>
      <Card.Footer className="flex justify-between gap-3">
        <Button
          fullWidth
          variant="secondary"
          // onPress={() => handleProductClick(product)}
        >
          Agregar al carrito
        </Button>
        <Button
          fullWidth
          variant="primary"
          onPress={() => handleProductClick(product)}
        >
          {primaryButtonText}
        </Button>
      </Card.Footer>
    </Card>
  )
}
