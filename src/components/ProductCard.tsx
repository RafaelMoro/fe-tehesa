"use client"
import { useState } from "react"
import { Button, Spinner, toast } from "@heroui/react"
import { RiArrowRightLine, RiPriceTag3Line } from "@remixicon/react"

import { Product, ProductVariant } from "@/shared/types/global.types"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"
import { fetchCatalog } from "@/shared/utils/catalog-api.utils"
import { CART_MAX_LINES } from "@/shared/constants/cart.constants"
import { useCartStore } from "@/zustand/provider/cart.provider"

interface ProductCardProps {
  product: Product
  handleProductClick: (product: Product) => void
  image?: { src: string; alt: string }
}

const ADD_LIMIT_MESSAGE = `Tu lista llegó al máximo de ${CART_MAX_LINES} productos.`
const ADD_FAILURE_MESSAGE = "No se pudo agregar. Intenta de nuevo."

const PILL_CLASS =
  "shrink-0 rounded-full bg-gray-100 px-2 py-[3px] text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400"

const CHIP_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-gray-200 py-[3px] pr-[9px] pl-[7px] text-[11px] text-gray-700 dark:border-gray-700 dark:text-gray-200"

const splitCurrency = (
  priceString: string | null,
): [string | null, string | null] => {
  if (priceString == null) {
    return [null, null]
  }

  const splitIndex = priceString.lastIndexOf(" ")

  return [priceString.slice(0, splitIndex), priceString.slice(splitIndex + 1)]
}

export const ProductCard = ({
  product,
  handleProductClick,
  image,
}: ProductCardProps) => {
  const addProductLine = useCartStore((store) => store.addProductLine)
  const addVariantLines = useCartStore((store) => store.addVariantLines)
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const isSingleVariant = product.variantCount === 1
  const minPriceString =
    product.minPrice == null ? null : formatNumberToCurrency(product.minPrice)
  const maxPriceString =
    product.maxPrice == null ? null : formatNumberToCurrency(product.maxPrice)
  const primaryButtonText =
    product.variantCount != null
      ? `Explorar las ${product.variantCount} variantes`
      : "Ver variantes"
  const [minPriceAmount, minPriceCurrency] = splitCurrency(minPriceString)
  const variantPill =
    product.variantCount != null
      ? product.variantCount === 1
        ? "1 variante"
        : `${product.variantCount} variantes`
      : null

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
    <article className="flex h-full flex-col gap-3.5 rounded-[14px] border border-gray-200 bg-white p-4 transition-[box-shadow,border-color] duration-200 hover:border-gray-300 hover:shadow-[0_8px_24px_rgba(17,24,39,.08)] max-sm:gap-3 max-sm:p-3.5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:shadow-none">
      {image && (
        <div className="aspect-[4/3] overflow-hidden rounded-[10px] bg-gray-100 max-sm:aspect-video dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element -- no Strapi media host / remotePatterns yet (D5) */}
          <img
            src={image.src}
            alt={image.alt}
            className="size-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {product.category && (
            <span className="truncate text-[11px] font-medium tracking-[.08em] text-primary-500 uppercase dark:text-primary-100">
              {product.category.name}
            </span>
          )}
          {variantPill && (
            <span className={`${PILL_CLASS} max-sm:hidden`}>
              {variantPill}
            </span>
          )}
        </div>
        <h2 className="line-clamp-3 text-[17px] leading-[1.35] font-semibold text-gray-900 max-sm:text-base dark:text-[#EDEDED]">
          {product.name}
        </h2>
        {(product.brand || variantPill) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {product.brand && (
              <span className={CHIP_CLASS}>
                <RiPriceTag3Line
                  size={12}
                  aria-hidden="true"
                  className="text-gray-500 dark:text-gray-400"
                />
                {product.brand.name}
              </span>
            )}
            {variantPill && (
              <span className={`${PILL_CLASS} sm:hidden`}>{variantPill}</span>
            )}
          </div>
        )}
        {minPriceString && maxPriceString && (
          <div className="mt-auto flex flex-col gap-0.5">
            <span className="text-[11px] tracking-[.08em] text-gray-500 uppercase dark:text-gray-400">
              {isSingleVariant ? "Precio" : "Desde"}
            </span>
            <div className="flex items-baseline justify-between gap-2 sm:flex-col sm:items-start sm:gap-0">
              <span>
                <span className="text-[21px] font-semibold tracking-[-0.015em] text-gray-900 max-sm:text-xl dark:text-[#EDEDED]">
                  {minPriceAmount}
                </span>{" "}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {minPriceCurrency}
                </span>
              </span>
              {!isSingleVariant && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  hasta {maxPriceString}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {isSingleVariant ? (
          <>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="rounded-[10px]"
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
              variant="primary"
              size="lg"
              fullWidth
              className="rounded-[10px]"
              onPress={() => handleProductClick(product)}
            >
              {primaryButtonText}
              <RiArrowRightLine size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              fullWidth
              className="rounded-[10px] font-normal text-primary-700 hover:border-primary-800 hover:bg-primary-800 hover:text-white max-sm:border-0 dark:border-gray-700 dark:text-primary-100"
              onPress={handleAddProductLine}
            >
              Agregar y elegir después
            </Button>
          </>
        )}
      </div>
    </article>
  )
}
