"use client"
import { useMemo } from "react"
import { Card, CardBody, CardHeader, Image } from "@heroui/react"

import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
import { Product } from "@/shared/types/global.types"
import { formatNumberToCurrency } from "@/shared/utils/global.utils"

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { isMobile } = useMediaQuery()
  
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
              <h5 className="text-2xl font-bold">{product.name}</h5>
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
          <div className="flex flex-col">
            <h5 className="text-2xl font-bold">{product.name}</h5>
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
        </CardHeader>
      )}
    </Card>
  )
}