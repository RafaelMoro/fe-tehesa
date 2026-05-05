"use client"
import { useMediaQuery } from "@/shared/hooks/useMediaQuery"
import { Product } from "@/shared/types/global.types"
import { Card, CardBody, CardHeader, Image } from "@heroui/react"

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { isMobile } = useMediaQuery()

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
          </div>
        </CardHeader>
      )}
    </Card>
  )
}