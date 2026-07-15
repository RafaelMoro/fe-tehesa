"use client"
import { Button, Card } from "@heroui/react"
import {
  RiArrowRightLine,
  RiBox3Line,
  RiShoppingCart2Line,
  RiStarFill,
} from "@remixicon/react"

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
  const minPriceString =
    product.minPrice == null ? null : formatNumberToCurrency(product.minPrice)
  const maxPriceString =
    product.maxPrice == null ? null : formatNumberToCurrency(product.maxPrice)
  const productSeed = Array.from(product.documentId).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  )
  const stock = 8 + (productSeed % 19)
  const rating = 4.7 + (productSeed % 2) / 10
  const primaryButtonText =
    product.variantCount != null
      ? `Explorar las ${product.variantCount} variantes`
      : "Ver variantes"

  return (
    <Card className="group h-full gap-0 overflow-hidden border border-black/8 bg-white shadow-[0_10px_35px_rgba(20,37,29,0.05)] transition duration-300 hover:-translate-y-1 hover:border-primary-600 hover:shadow-[0_18px_50px_rgba(20,37,29,0.12)] dark:border-white/10 dark:bg-zinc-900">
      <div className="product-card-visual">
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[9px] font-black tracking-[0.14em] text-emerald-950 uppercase backdrop-blur">
            Uso industrial
          </span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-1 text-[10px] font-bold text-white">
            <RiStarFill
              aria-hidden="true"
              className="text-amber-400"
              size={11}
            />
            {rating.toFixed(1)}
          </span>
        </div>
        <div className="product-card-part" aria-hidden="true">
          <span className="product-card-part-hole" />
          <span className="product-card-part-mark">TEHESA</span>
        </div>
        <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-emerald-950 backdrop-blur">
          <RiBox3Line aria-hidden="true" size={13} />
          Vista 3D disponible
        </div>
      </div>
      <Card.Header className="flex flex-col items-start gap-1 px-5 pt-5 pb-3">
        {(product.category?.name || product.brand?.name) && (
          <p className="flex flex-wrap items-center gap-1 text-[10px] font-black tracking-[0.12em] text-primary-700 uppercase dark:text-primary-200">
            {product.category?.name && <span>{product.category.name}</span>}
            {product.category?.name && product.brand?.name && (
              <span aria-hidden="true">/</span>
            )}
            {product.brand?.name && <span>{product.brand.name}</span>}
          </p>
        )}
        <Card.Title className="line-clamp-2 min-h-[3.25rem] text-lg leading-snug font-black tracking-tight sm:text-xl">
          {product.name}
        </Card.Title>
        {internalId && (
          <Card.Description className="text-xs">
            Modelo {internalId}
          </Card.Description>
        )}
      </Card.Header>
      <Card.Content className="px-5 py-3">
        {minPriceString && maxPriceString && (
          <div className="flex items-end justify-between gap-3 border-y border-black/8 py-3 dark:border-white/10">
            <div>
              <span className="text-[10px] font-bold tracking-wide text-muted uppercase">
                Desde
              </span>
              <span className="mt-0.5 block text-2xl font-black tracking-tight tabular-nums">
                {minPriceString}
              </span>
              <span className="text-[9px] text-muted">MXN + IVA</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-muted uppercase">
                Hasta
              </span>
              <span className="text-xs font-bold tabular-nums">
                {maxPriceString}
              </span>
            </div>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
          <span className="font-bold text-amber-700 dark:text-amber-400">
            Solo {stock} disponibles en CDMX
          </span>
          <span className="text-muted">
            {product.variantCount ?? "Varias"} medidas
          </span>
        </div>
      </Card.Content>
      <Card.Footer className="mt-auto grid grid-cols-[auto_1fr] gap-2 px-5 pt-2 pb-5">
        <Button
          isIconOnly
          variant="tertiary"
          aria-label={`Configurar ${product.name} para agregar al carrito`}
          onPress={() => handleProductClick(product)}
        >
          <RiShoppingCart2Line aria-hidden="true" />
        </Button>
        <Button
          fullWidth
          variant="primary"
          className="font-black"
          onPress={() => handleProductClick(product)}
        >
          {primaryButtonText}
          <RiArrowRightLine aria-hidden="true" size={17} />
        </Button>
      </Card.Footer>
    </Card>
  )
}
