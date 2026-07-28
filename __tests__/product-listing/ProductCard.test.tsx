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
    }

    render(<ProductCard product={product} handleProductClick={jest.fn()} />)

    expect(
      screen.getByRole("button", { name: "Explorar las 0 variantes" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Desde").parentElement).toHaveTextContent(
      "$0.00 MXN",
    )
    expect(screen.getByText("Hasta").parentElement).toHaveTextContent(
      "$0.00 MXN",
    )
  })

  it("shows a single price when the product has one variant", () => {
    const product: Product = {
      name: "Single Variant Tire",
      documentId: "single-1",
      category: { name: "Tubes" },
      brand: { name: "Acme" },
      variantCount: 1,
      minPrice: 704.03,
      maxPrice: 704.03,
      hasOneProductVariant: true,
    }

    render(<ProductCard product={product} handleProductClick={jest.fn()} />)

    expect(screen.getByText("Precio")).toBeInTheDocument()
    expect(screen.getByText("Precio").parentElement).toHaveTextContent(
      "$704.03 MXN",
    )
    expect(screen.queryByText("Desde")).not.toBeInTheDocument()
    expect(screen.queryByText("Hasta")).not.toBeInTheDocument()
  })

  it("hides the price block when the price range is missing", () => {
    const product: Product = {
      name: "Incomplete Product",
      documentId: "incomplete-1",
      category: { name: "Tubes" },
      brand: { name: "Acme" },
      minPrice: undefined,
      maxPrice: undefined,
    }

    render(<ProductCard product={product} handleProductClick={jest.fn()} />)

    expect(screen.queryByText("Desde")).not.toBeInTheDocument()
    expect(screen.queryByText("Precio")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Ver variantes" }),
    ).toBeInTheDocument()
  })
})
