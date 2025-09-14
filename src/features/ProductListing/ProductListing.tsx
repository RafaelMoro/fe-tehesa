import { ProductCard } from "@/components/ProductCard"
import { Product } from "@/shared/types/global.types"

interface ProductListingProps {
  products: Product[]
}

export const ProductListing = ({ products }: ProductListingProps) => {
  if (products.length === 0) {
    return (
      <div>No products available</div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      { products.map((product) => (
        <ProductCard key={product.name} product={product} />
      ))}
    </div>
  )
}