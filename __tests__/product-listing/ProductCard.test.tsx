import { render, screen } from "@__tests__/test-utils"
import { ProductCard } from "@/components/ProductCard"
import type { Product } from "@/shared/types/global.types"

describe("ProductCard", () => {
  it("shows zero variant count and zero price range", () => {
    const product: Product = {
      name: "Free Tire",
      documentId: "free-1",
      category: { name: "Tubes" },
      brand: { name: "Acme" },
      variantCount: 0,
      minPrice: 0,
      maxPrice: 0,
    }

    render(<ProductCard product={product} handleProductClick={jest.fn()} />)

    expect(screen.getByText(/0 variantes disponibles/)).toBeInTheDocument()
    expect(screen.getByText(/Desde/)).toHaveTextContent(
      "Desde $0.00 hasta $0.00",
    )
  })
})
