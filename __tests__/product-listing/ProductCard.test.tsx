import { toast } from "@heroui/react"

import { render, screen, userEvent } from "@__tests__/test-utils"
import { ProductCard } from "@/components/ProductCard"
import { useCartStore } from "@/zustand/provider/cart.provider"
import type { Product } from "@/shared/types/global.types"
import type { CatalogEnvelope } from "@/shared/utils/catalog-api.utils"

const CardHarness = ({ product }: { product: Product }) => {
  const lineCount = useCartStore((store) => store.lines.length)

  return (
    <>
      <ProductCard product={product} handleProductClick={jest.fn()} />
      <span>{lineCount} líneas en el carrito</span>
    </>
  )
}

const originalFetch = globalThis.fetch
const originalResizeObserver = globalThis.ResizeObserver

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const jsonResponse = <T,>(body: CatalogEnvelope<T>) =>
  ({
    json: async () => body,
  }) as Response

const mockFetch = () => {
  const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>()
  globalThis.fetch = fetchMock as typeof fetch
  return fetchMock
}

beforeEach(() => {
  localStorage.clear()
  globalThis.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver
})

afterEach(() => {
  globalThis.fetch = originalFetch
  globalThis.ResizeObserver = originalResizeObserver
  toast.clear()
})

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

  it("shows zero variant count and zero price range, keeping the standard footer", () => {
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
    expect(
      screen.getByRole("button", { name: "Agregar y elegir después" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Desde").parentElement).toHaveTextContent(
      "$0.00 MXN",
    )
    expect(screen.getByText("Hasta").parentElement).toHaveTextContent(
      "$0.00 MXN",
    )
  })

  it("shows a single price and one CTA when the product has one variant", () => {
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
    expect(
      screen.getByRole("button", { name: "Agregar 1 pieza" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Agregar y elegir después" }),
    ).not.toBeInTheDocument()
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

  it("adds a variant-less line with the tertiary CTA", async () => {
    const user = userEvent.setup()
    const product: Product = {
      name: "Multi Variant Tire",
      documentId: "multi-1",
      category: { name: "Tubes" },
      brand: { name: "Acme" },
      variantCount: 5,
      minPrice: 10,
      maxPrice: 50,
    }

    render(<CardHarness product={product} />)

    await user.click(
      screen.getByRole("button", { name: "Agregar y elegir después" }),
    )

    expect(await screen.findByText("1 líneas en el carrito")).toBeInTheDocument()
  })

  it("fetches once and stores a priced line on a single-variant add", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: [
          {
            documentId: "variant-1",
            internalId: "VAR-1",
            diameter: "1/4 in",
            pricing: { price: 15 },
          },
        ],
      }),
    )
    const product: Product = {
      name: "Single Variant Tire",
      documentId: "single-1",
      category: { name: "Tubes" },
      brand: { name: "Acme" },
      variantCount: 1,
      minPrice: 15,
      maxPrice: 15,
      hasOneProductVariant: true,
    }

    render(<CardHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Agregar 1 pieza" }))

    expect(await screen.findByText("1 líneas en el carrito")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/catalog/variants?documentId=single-1",
      undefined,
    )
  })

  it("shows a recoverable alert and leaves the button usable when the fetch fails", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockRejectedValue(new Error("network"))
    const product: Product = {
      name: "Single Variant Tire",
      documentId: "single-1",
      category: { name: "Tubes" },
      brand: { name: "Acme" },
      variantCount: 1,
      minPrice: 15,
      maxPrice: 15,
      hasOneProductVariant: true,
    }

    render(<CardHarness product={product} />)
    const button = screen.getByRole("button", { name: "Agregar 1 pieza" })
    await user.click(button)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo agregar. Intenta de nuevo.",
    )
    expect(button).toBeEnabled()
    expect(screen.getByText("0 líneas en el carrito")).toBeInTheDocument()
  })

  it("treats an empty variant result as a failure", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [] }))
    const product: Product = {
      name: "Single Variant Tire",
      documentId: "single-1",
      category: { name: "Tubes" },
      brand: { name: "Acme" },
      variantCount: 1,
      minPrice: 15,
      maxPrice: 15,
      hasOneProductVariant: true,
    }

    render(<CardHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Agregar 1 pieza" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo agregar. Intenta de nuevo.",
    )
  })
})
