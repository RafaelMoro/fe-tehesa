/**
 * @jest-environment jsdom
 */
import { render, screen, userEvent, waitFor, within } from "@__tests__/test-utils"
import { Home } from "@/features/Home/Home"
import type { Product, TaxonomyItem } from "@/shared/types/global.types"

const pushMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

const originalScrollTo = window.scrollTo

const products: Product[] = [
  {
    name: "Tire A",
    documentId: "doc-1",
    category: { name: "Tubes" },
    brand: { name: "Acme" },
  },
  {
    name: "Brake B",
    documentId: "doc-2",
    category: { name: "Brakes" },
    brand: { name: "Acme" },
  },
  {
    name: "Chain C",
    documentId: "doc-3",
    category: { name: "Drivetrain" },
    brand: { name: "Other" },
  },
]

const categories: TaxonomyItem[] = [
  { name: "Tubes", customId: "tubes" },
  { name: "Brakes", customId: "brakes" },
]

const brands: TaxonomyItem[] = [
  { name: "Acme", customId: "acme" },
  { name: "Other", customId: "other" },
]

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => "application/json" },
  json: async () => body,
})

const originalFetch = globalThis.fetch

const setFetch = (impl: typeof fetch) => {
  globalThis.fetch = impl
}

const resetFetch = () => {
  globalThis.fetch = originalFetch
}

beforeEach(() => {
  pushMock.mockReset()
  window.scrollTo = jest.fn()
})

afterEach(() => {
  resetFetch()
  window.scrollTo = originalScrollTo
})

const renderHome = (overrides: Partial<Parameters<typeof Home>[0]> = {}) =>
  render(
    <Home
      products={products}
      currentPage={1}
      totalPages={5}
      categories={categories}
      brands={brands}
      {...overrides}
    />,
  )

describe("Home - local filtering", () => {
  it("stacks local name, category, and brand filters; clear restores working set", async () => {
    const user = userEvent.setup()
    renderHome()

    const nameInput = screen.getByLabelText("Filtrar resultados visibles")
    await user.type(nameInput, "tire")

    const categoryTriggers = screen.getAllByRole("button", {
      name: /Filtrar por categoría visible/,
    })
    await user.click(categoryTriggers[0])
    await user.click(await screen.findByText("Tubes"))

    expect(screen.getByText("Tire A")).toBeInTheDocument()
    expect(screen.queryByText("Chain C")).not.toBeInTheDocument()

    const clearButton = screen.getByRole("button", { name: "Limpiar filtros" })
    await user.click(clearButton)

    await waitFor(() => {
      expect(screen.getByText("Chain C")).toBeInTheDocument()
    })
  })

  it("opens the catalog search drawer from the main button", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
    )

    expect(
      await screen.findByRole("dialog", { name: "Buscar en todo el catálogo" }),
    ).toBeInTheDocument()
  })
})

describe("Home - catalog-wide modes through the drawer", () => {
  it("applies category then brand wide results; replaces data and resets local filters", async () => {
    const user = userEvent.setup()
    const fetchMock = jest.fn<
      Promise<{ ok: boolean; status: number; headers: { get: () => string }; json: () => Promise<unknown> }>,
      [RequestInfo, RequestInit?]
    >()

    setFetch(fetchMock as unknown as typeof fetch)

    const categoryProducts: Product[] = [
      {
        name: "CatProduct",
        documentId: "cat-1",
        category: { name: "Tubes" },
        brand: { name: "Acme" },
      },
    ]
    const brandProducts: Product[] = [
      {
        name: "BrandProduct",
        documentId: "brand-1",
        category: { name: "Brakes" },
        brand: { name: "Other" },
      },
    ]

    fetchMock.mockImplementation((url) => {
      const target = String(url)
      if (target.includes("/api/catalog/category")) {
        return Promise.resolve(jsonResponse({ success: true, data: categoryProducts }))
      }
      if (target.includes("/api/catalog/brand")) {
        return Promise.resolve(jsonResponse({ success: true, data: brandProducts }))
      }
      return Promise.resolve(jsonResponse({ success: true, data: [] }))
    })

    renderHome()

    // Open the catalog search drawer
    await user.click(
      screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Buscar en todo el catálogo",
    })

    // Select category inside the drawer
    const categoryDropdown = within(dialog).getByRole("button", {
      name: /Buscar categoría en todo el catálogo/,
    })
    await user.click(categoryDropdown)
    await user.click(await screen.findByText("Tubes"))

    await waitFor(() => {
      expect(screen.getByText("CatProduct")).toBeInTheDocument()
    })

    const lastCategoryCall = fetchMock.mock.calls
      .map((c) => String(c[0]))
      .filter((u) => u.includes("/api/catalog/category"))
      .pop()
    expect(lastCategoryCall).toBe(
      "/api/catalog/category?categoryId=tubes&page=1",
    )

    // Open drawer again and select brand
    await user.click(
      screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
    )
    const dialog2 = await screen.findByRole("dialog", {
      name: "Buscar en todo el catálogo",
    })
    const brandDropdown = within(dialog2).getByRole("button", {
      name: /Buscar marca en todo el catálogo/,
    })
    await user.click(brandDropdown)
    await user.click(await screen.findByText("Other"))

    await waitFor(() => {
      expect(screen.getByText("BrandProduct")).toBeInTheDocument()
    })

    const lastBrandCall = fetchMock.mock.calls
      .map((c) => String(c[0]))
      .filter((u) => u.includes("/api/catalog/brand"))
      .pop()
    expect(lastBrandCall).toBe("/api/catalog/brand?brandId=other&page=1")

    expect(screen.queryByText("CatProduct")).not.toBeInTheDocument()
  })

  it("keeps the original products visible when a drawer interaction is dismissed", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
    )
    expect(
      await screen.findByRole("dialog", { name: "Buscar en todo el catálogo" }),
    ).toBeInTheDocument()

    // Original products remain visible while the drawer is open
    expect(screen.getByText("Tire A")).toBeInTheDocument()
    expect(screen.getByText("Chain C")).toBeInTheDocument()
  })
})

describe("Home - pagination", () => {
  it("calls push and scrollTo for normal pagination", async () => {
    const user = userEvent.setup()
    renderHome()

    const page2 = screen.getByRole("button", { name: "2" })
    await user.click(page2)

    expect(pushMock).toHaveBeenCalledWith("/?page=2")
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    })
  })

  it("enables Siguiente for 50-item wide result and uses the active mode parameter on page 2", async () => {
    const user = userEvent.setup()
    const fetchMock = jest.fn<Promise<{ ok: boolean; status: number; headers: { get: () => string }; json: () => Promise<unknown> }>, [RequestInfo, RequestInit?]>()
    setFetch(fetchMock as unknown as typeof fetch)

    const page1Products: Product[] = Array.from({ length: 50 }, (_, index) => ({
      name: `Wide ${index + 1}`,
      documentId: `wide-${index + 1}`,
      category: { name: "Tubes" },
      brand: { name: "Acme" },
    }))
    const page2Products: Product[] = Array.from({ length: 50 }, (_, index) => ({
      name: `Page2 ${index + 1}`,
      documentId: `p2-${index + 1}`,
      category: { name: "Tubes" },
      brand: { name: "Acme" },
    }))

    fetchMock.mockImplementation((url) => {
      const target = String(url)
      if (target.includes("page=2")) {
        return Promise.resolve(jsonResponse({ success: true, data: page2Products }))
      }
      return Promise.resolve(jsonResponse({ success: true, data: page1Products }))
    })

    renderHome()

    await user.click(
      screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Buscar en todo el catálogo",
    })
    const categoryDropdown = within(dialog).getByRole("button", {
      name: /Buscar categoría en todo el catálogo/,
    })
    await user.click(categoryDropdown)
    await user.click(await screen.findByText("Tubes"))

    const siguiente = await screen.findByRole("button", { name: "Siguiente" })
    expect(siguiente).not.toBeDisabled()

    const anterior = screen.getByRole("button", { name: "Anterior" })
    expect(anterior).toBeDisabled()

    await user.click(siguiente)

    await waitFor(() => {
      expect(screen.getByText("Página 2")).toBeInTheDocument()
    })

    const page2Call = fetchMock.mock.calls
      .map((c) => String(c[0]))
      .filter((u) => u.includes("page=2"))
      .pop()
    expect(page2Call).toBe("/api/catalog/category?categoryId=tubes&page=2")
  })
})

describe("Home - product details", () => {
  it("opens the variants drawer with the selected product's documentId", async () => {
    const user = userEvent.setup()
    const fetchMock = jest.fn<Promise<{ ok: boolean; status: number; headers: { get: () => string }; json: () => Promise<unknown> }>, [RequestInfo, RequestInit?]>()
    setFetch(fetchMock as unknown as typeof fetch)
    fetchMock.mockImplementation((url) => {
      const target = String(url)
      if (target.includes("/api/catalog/variants")) {
        return Promise.resolve(jsonResponse({ success: true, data: [] }))
      }
      return Promise.resolve(jsonResponse({ success: true, data: [] }))
    })

    renderHome()

    const verDetallesButtons = screen.getAllByRole("button", {
      name: "Ver detalles",
    })
    await user.click(verDetallesButtons[0])

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Tire A")).toBeInTheDocument()

    const variantsCall = fetchMock.mock.calls
      .map((c) => String(c[0]))
      .find((u) => u.includes("/api/catalog/variants"))
    expect(variantsCall).toBe("/api/catalog/variants?documentId=doc-1")
  })
})
