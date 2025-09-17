import { Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"

interface HomeProps {
  products: Product[]
}

export const Home = ({ products }: HomeProps) => {
  return (
    <ProductListing products={products} />
  )
}