"use client"
import { useMemo } from "react"
import { Card, CardBody, CardHeader, Image, Chip } from "@heroui/react"

import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
import { Product } from "@/shared/types/global.types"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"
import { RiBookmarkLine, RiPriceTag3Line, RiStackLine } from "@remixicon/react"

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { isMobile } = useMediaQuery()
  
  const brandName = product?.brand?.name ?? null
  const minPriceString = useMemo(() => {
    if (!product.minPrice) return null
    return formatNumberToCurrency(product.minPrice)
  }, [product.minPrice])

  const maxPriceString = useMemo(() => {
    if (!product.maxPrice) return null
    return formatNumberToCurrency(product.maxPrice)
  }, [product.maxPrice])


  return (
    <Card>
      { isMobile && (
        <>
          <CardHeader className="flex justify-center">
              {/* <Image
                alt={product.name}
                height={200}
                width={200}
                radius="sm"
                src={`http://localhost:1337${product.image.url}`}
              /> */}
          </CardHeader>
          <CardBody>
            <div className="flex flex-col">
              <div className="flex flex-col gap-2">
                <span className="text-gray-400 text-sm">{product.category.name} | {product.brand.name}</span>
                <h5 className="text-2xl font-bold">{product.name}</h5>
              </div>
              { product?.category?.name && (
                <p className="text-gray-400">{product.category.name}</p>
              )}
              { (minPriceString && maxPriceString) && (
                <p className="text-white text-sm">Desde {minPriceString} hasta {maxPriceString}</p>
              )}
              { product?.variantCount && (
                <p className="text-white text-sm">{product.variantCount} variantes disponibles</p>
              )}
            </div>
          </CardBody>
        </>
      ) }
      { !isMobile && (
        <CardHeader className="flex gap-3">
          {/* <Image
            alt={product.name}
            height={200}
            width={200}
            radius="sm"
            src={`http://localhost:1337${product.image.url}`}
          /> */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="inline-flex gap-1 text-gray-400">
                <RiBookmarkLine size={18} />
                <span className="text-sm">
                  {product.category?.name} {brandName && `| ${brandName}`}
                </span>
              </div>
              <h5 className="text-2xl font-bold">{product.name}</h5>
            </div>
            { product?.variantCount && (
               <Chip size="sm">
                <div className="inline-flex gap-2">
                  <RiStackLine size={18} />
                  {product.variantCount} variantes disponibles
                </div>
              </Chip>
            )}
            { (minPriceString && maxPriceString) && (
              <div className="flex gap-1 text-gray-400">
                <RiPriceTag3Line size={22} />
                <p>Desde <span className="font-bold text-xl text-gray-950 dark:text-gray-100">{minPriceString}</span> hasta {maxPriceString}</p>
              </div>
            )}
          </div>
        </CardHeader>
      )}
    </Card>
  )
}