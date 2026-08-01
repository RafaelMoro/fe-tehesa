"use client"
import { useState } from "react"
import { Button, Card, Spinner, toast } from "@heroui/react"

import { Product, ProductVariant } from "@/shared/types/global.types"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"
import { fetchCatalog } from "@/shared/utils/catalog-api.utils"
import { CART_MAX_LINES } from "@/shared/constants/cart.constants"
import { useCartStore } from "@/zustand/provider/cart.provider"

interface ProductCardProps {
  product: Product
  handleProductClick: (product: Product) => void
}

const ADD_LIMIT_MESSAGE = `Tu lista llegó al máximo de ${CART_MAX_LINES} productos.`
const ADD_FAILURE_MESSAGE = "No se pudo agregar. Intenta de nuevo."

export const ProductCard = ({
  product,
  handleProductClick,
}: ProductCardProps) => {
  const addProductLine = useCartStore((store) => store.addProductLine)
  const addVariantLines = useCartStore((store) => store.addVariantLines)
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const isSingleVariant = product.variantCount === 1
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

  const handleAddProductLine = () => {
    const result = addProductLine({
      productDocumentId: product.documentId,
      productName: product.name,
      variantDocumentId: null,
      unitPrice: null,
      quantity: 1,
    })

    if (result.rejected) {
      toast.danger(ADD_LIMIT_MESSAGE)
      return
    }

    toast.success("Producto agregado, elige la medida después")
  }

  const handleAddSingleVariant = async () => {
    setAddError(null)
    setIsAdding(true)
    try {
      const data = await fetchCatalog<ProductVariant[]>(
        `/api/catalog/variants?documentId=${encodeURIComponent(product.documentId)}`,
      )
      const variant = data[0]

      if (!variant) {
        setAddError(ADD_FAILURE_MESSAGE)
        return
      }

      const result = addVariantLines([
        {
          productDocumentId: product.documentId,
          productName: product.name,
          variantDocumentId: variant.documentId,
          internalId: variant.internalId,
          diameter: variant.diameter,
          unitPrice: variant.pricing.price,
          quantity: 1,
        },
      ])

      if (result.rejected) {
        toast.danger(ADD_LIMIT_MESSAGE)
        return
      }

      toast.success("1 pieza agregada")
    } catch {
      setAddError(ADD_FAILURE_MESSAGE)
    } finally {
      setIsAdding(false)
    }
  }

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
      </Card.Header>
      <Card.Content className="border-t border-default-200 px-5 py-4">
        {minPriceString &&
          maxPriceString &&
          (isSingleVariant ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted uppercase">Precio</span>
              <span className="text-xl font-bold">{minPriceString}</span>
            </div>
          ) : (
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
          ))}
      </Card.Content>
      <Card.Footer className="flex flex-col gap-2">
        {isSingleVariant ? (
          <>
            <Button
              fullWidth
              variant="primary"
              isDisabled={isAdding}
              onPress={handleAddSingleVariant}
            >
              {isAdding && (
                <Spinner size="sm" aria-hidden="true" color="current" />
              )}
              Agregar 1 pieza
            </Button>
            {addError && (
              <p role="alert" className="text-sm text-danger">
                {addError}
              </p>
            )}
          </>
        ) : (
          <>
            <Button
              fullWidth
              variant="primary"
              onPress={() => handleProductClick(product)}
            >
              {primaryButtonText}
            </Button>
            <Button
              fullWidth
              variant="tertiary"
              className="min-h-11 border-0 bg-transparent shadow-none hover:bg-transparent"
              onPress={handleAddProductLine}
            >
              Agregar y elegir después
            </Button>
          </>
        )}
      </Card.Footer>
    </Card>
  )
}
