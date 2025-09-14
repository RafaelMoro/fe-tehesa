"use client"
import { Product } from "@/shared/types/global.types"
import { Card, CardHeader, Image } from "@heroui/react"

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const categoryLabels: Record<string, string> = {
    'twist_drill_bits': 'Brocas',
    'shockwave_impact_adapter': 'Broquero',
    'hex_keys': 'Llave hexagonal',
  }

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
          <p className="text-gray-400">{categoryLabels[product.category] ?? product.category}</p>
        </div>
      </CardHeader>
    </Card>
  )
}