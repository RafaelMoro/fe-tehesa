"use client"
import { Product } from "@/shared/types/global.types"
import { Card, CardBody, CardHeader, Image } from "@heroui/react"

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card>
      <CardHeader className="flex gap-3">
        <Image
          alt={product.name}
          height={200}
          width={200}
          radius="sm"
          src={`http://localhost:1337${product.image.url}`}
        />
        <div className="flex flex-col">
          <h5 className="text-2xl font-bold">{product.name}</h5>
        </div>
      </CardHeader>
      <CardBody>
        <p>Category: {product.category}</p>
      </CardBody>
    </Card>
  )
}