"use client"
import { useMemo } from "react"
import { Card, Chip, Button } from "@heroui/react"
import { RiBookmarkLine, RiPriceTag3Line, RiStackLine } from "@remixicon/react"
import clsx from "clsx"

import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
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
  const { isMobile } = useMediaQuery()

  const brandName = product?.brand?.name ?? null
  const minPriceString = useMemo(() => {
    if (product.minPrice == null) {
      return null
    }
    return formatNumberToCurrency(product.minPrice)
  }, [product.minPrice])

  const maxPriceString = useMemo(() => {
    if (product.maxPrice == null) {
      return null
    }
    return formatNumberToCurrency(product.maxPrice)
  }, [product.maxPrice])

  const cardHeaderCss = clsx(
    { "flex justify-center": isMobile },
    { "flex gap-3": !isMobile },
  )
  const titleCSS = clsx(
    "font-bold",
    { "text-2xl": !isMobile },
    { "text-xl": isMobile },
  )

  return (
    <Card>
      <Card.Header className={cardHeaderCss}>
        {/* <Image // IMAGE COMP MOBILE
            alt={product.name}
            height={200}
            width={200}
            radius="sm"
            src={`http://localhost:1337${product.image.url}`}
          /> */}
        {/* <Image // IMAGE COMP DESKTOP
          alt={product.name}
          height={200}
          width={200}
          radius="sm"
          src={`http://localhost:1337${product.image.url}`}
        /> */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex gap-1 text-gray-400">
            <RiBookmarkLine size={18} />
            <span className="text-sm">
              {product.category?.name} {brandName && `| ${brandName}`}
            </span>
          </div>
          <h5 className={titleCSS}>{product.name}</h5>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-col gap-6">
          {product.variantCount != null && (
            <Chip size="sm">
              <div className="inline-flex gap-2">
                <RiStackLine size={18} />
                {product.variantCount} variantes disponibles
              </div>
            </Chip>
          )}
          {minPriceString && maxPriceString && (
            <div className="flex gap-1 text-gray-400">
              <RiPriceTag3Line size={22} />
              <p>
                Desde{" "}
                <span className="font-bold text-xl text-gray-950 dark:text-gray-100">
                  {minPriceString}
                </span>{" "}
                hasta {maxPriceString}
              </p>
            </div>
          )}
        </div>
      </Card.Content>
      <Card.Footer>
        <Button variant="primary" onPress={() => handleProductClick(product)}>
          Ver detalles
        </Button>
      </Card.Footer>
    </Card>
  )
}
