import { ProductCard } from "@/components/ProductCard"
import { Product } from "@/shared/types/global.types"

interface ProductListingProps {
  products: Product[];
  handleProductClick: (product: Product) => void;
}

export const ProductListing = ({ products, handleProductClick }: ProductListingProps) => {
  if (products.length === 0) {
    return (
      <div>No products available</div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      { products.map((product) => (
        <ProductCard key={product.documentId} product={product} handleProductClick={handleProductClick} />
      ))}
    </div>
  )
}