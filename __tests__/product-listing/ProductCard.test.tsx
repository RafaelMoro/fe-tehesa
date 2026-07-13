import { render, screen } from "@__tests__/test-utils"
import { ProductCard } from "@/components/ProductCard"
import type { Product } from "@/shared/types/global.types"

describe("ProductCard", () => {
  it("renders when a product relation is missing", () => {
    const product: Product = {
      name: "Uncategorized Tire",
      documentId: "uncategorized-1",
      category: null,
      brand: { name: "Acme" },
    }

    render(<ProductCard product={product} handleProductClick={jest.fn()} />)

    expect(screen.getByText("Acme")).toBeInTheDocument()
  })

  it("shows zero variant count and zero price range", () => {
    const product: Product = {
      name: "Free Tire",
      documentId: "free-1",
      category: { name: "Tubes" },
      brand: { name: "Acme" },
      variantCount: 0,
      minPrice: 0,
      maxPrice: 0,
      product_variants: [
        { internalId: "TIRE-001", diameter: "15\"", pricing: { price: 0 } },
      ],
    }

    render(<ProductCard product={product} handleProductClick={jest.fn()} />)

    expect(
      screen.getByRole("button", { name: "Explorar las 0 variantes" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Modelo TIRE-001")).toBeInTheDocument()
    expect(screen.getByText("Desde").parentElement).toHaveTextContent("$0.00")
    expect(screen.getByText("Hasta").parentElement).toHaveTextContent("$0.00")
  })
})
