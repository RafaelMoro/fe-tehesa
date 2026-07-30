/**
 * @jest-environment jsdom
 */
import {
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from "@__tests__/test-utils"
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
    variantCount: 2,
    category: { name: "Tubes" },
    brand: { name: "Acme" },
  },
  {
    name: "Brake B",
    documentId: "doc-2",
    variantCount: 1,
    category: { name: "Brakes" },
    brand: { name: "Acme" },
  },
  {
    name: "Chain C",
    documentId: "doc-3",
    variantCount: 3,
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
      totalPages={7}
      categories={categories}
      brands={brands}
      {...overrides}
    />,
  )

describe("Home - local filtering", () => {
  it.skip("stacks local name, category, and brand filters; clear restores working set", async () => {
    const user = userEvent.setup()
    renderHome()

    const nameInput = screen.getByLabelText("Filtrar resultados visibles")
    await user.type(nameInput, "tire")

    const categoryTriggers = screen.getAllByRole("button", {
      name: "Todas las categorías",
    })
    await user.click(categoryTriggers[0])
    await user.click(await screen.findByText("Tubes"))

    expect(screen.getByText("Tire A")).toBeInTheDocument()
    expect(screen.queryByText("Chain C")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }))

    await waitFor(() => {
      expect(screen.getByText("Chain C")).toBeInTheDocument()
    })
  })
})

describe("Home - URL-backed catalog modes", () => {
  it("submits name search as a canonical URL", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      screen.getByRole("button", { name: "Buscar en catálogo completo" }),
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Búsqueda ampliada",
    })
    await user.type(
      within(dialog).getByLabelText("Nombre del producto"),
      " llave ",
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Buscar en todo el catálogo" }),
    )

    expect(pushMock).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/?mode=name&q=llave&page=1")
    })
  })

  it("navigates category and brand by encoded names", async () => {
    const user = userEvent.setup()
    renderHome({
      categories: [{ name: "Tubos PVC", customId: "tubes" }],
      brands: [{ name: "Marca Norte", customId: "north" }],
    })

    await user.click(
      screen.getByRole("button", { name: "Buscar en catálogo completo" }),
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Búsqueda ampliada",
    })
    await user.click(within(dialog).getByRole("button", { name: "Categoría" }))
    await user.click(
      within(dialog).getByRole("button", {
        name: /Buscar categoría en todo el catálogo/,
      }),
    )
    await user.click(await screen.findByText("Tubos PVC"))
    expect(pushMock).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(pushMock).toHaveBeenLastCalledWith(
        "/?mode=category&category=Tubos%20PVC&page=1",
      )
    })
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Búsqueda ampliada" })).not.toBeInTheDocument()
    })

    await user.click(
      screen.getByRole("button", { name: "Buscar en catálogo completo" }),
    )
    const dialog2 = await screen.findByRole("dialog", {
      name: "Búsqueda ampliada",
    })
    await user.click(within(dialog2).getByRole("button", { name: "Marca" }))
    await user.click(
      within(dialog2).getByRole("button", {
        name: /Buscar marca en todo el catálogo/,
      }),
    )
    await user.click(await screen.findByText("Marca Norte"))
    await waitFor(() => {
      expect(pushMock).toHaveBeenLastCalledWith(
        "/?mode=brand&brand=Marca%20Norte&page=1",
      )
    })
  })

  it("clear wide search returns to base page 1", async () => {
    const user = userEvent.setup()
    renderHome({ catalogMode: "name", catalogValue: "llave", catalogPage: 2 })

    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }))

    expect(pushMock).toHaveBeenCalledWith("/?page=1")
  })
})

describe("Home - pagination", () => {
  it("renders page 2 as a real link and the current page as a non-link", () => {
    renderHome()

    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute(
      "href",
      "/?page=2",
    )
    expect(screen.getByText(/Mostrando/)).toHaveTextContent(
      "Mostrando 1-3 de 333 productos",
    )

    expect(screen.queryByRole("link", { name: "1" })).not.toBeInTheDocument()
    expect(screen.getByText("1")).toHaveAttribute("aria-current", "page")
  })

  it("renders base prev/next as links, disabled (not a link) at the edges", () => {
    renderHome()

    expect(
      screen.queryByRole("link", { name: "Página anterior" }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText("Página anterior")).toHaveAttribute(
      "aria-disabled",
      "true",
    )
    expect(
      screen.getByRole("link", { name: "Página siguiente" }),
    ).toHaveAttribute("href", "/?page=2")
  })

  it("uses canonical wide Anterior/Siguiente URLs", () => {
    renderHome({
      catalogMode: "category",
      catalogValue: "Tubos PVC",
      catalogPage: 2,
      hasPreviousCatalogPage: true,
      hasNextCatalogPage: true,
    })

    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute(
      "href",
      "/?mode=category&category=Tubos+PVC&page=1",
    )
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/?mode=category&category=Tubos+PVC&page=3",
    )
  })

  it("shows notice=end feedback and renders Siguiente as disabled, not a link", () => {
    renderHome({
      catalogMode: "brand",
      catalogValue: "Acme",
      catalogPage: 2,
      hasPreviousCatalogPage: true,
      hasNextCatalogPage: true,
      initialCatalogFeedback: {
        kind: "status",
        message: "No hay más resultados.",
      },
    })

    expect(screen.getByRole("status")).toHaveTextContent(
      "No hay más resultados.",
    )
    expect(
      screen.queryByRole("link", { name: "Siguiente" }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("Siguiente")).toHaveAttribute(
      "aria-disabled",
      "true",
    )
  })

  it("never renders a pagination control with href=\"#\"", () => {
    renderHome()

    screen.getAllByRole("link").forEach((link) => {
      expect(link.getAttribute("href")).not.toBe("#")
    })
  })
})

describe("Home - product details", () => {
  it("opens the variants drawer with the selected product's documentId", async () => {
    const user = userEvent.setup()
    const fetchMock = jest.fn<
      Promise<{
        ok: boolean
        status: number
        headers: { get: () => string }
        json: () => Promise<unknown>
      }>,
      [RequestInfo, RequestInit?]
    >()
    setFetch(fetchMock as unknown as typeof fetch)
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [] }))

    renderHome()

    await user.click(
      screen.getByRole("button", { name: "Explorar las 2 variantes" }),
    )

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Tire A")).toBeInTheDocument()

    const variantsCall = fetchMock.mock.calls
      .map((c) => String(c[0]))
      .find((u) => u.includes("/api/catalog/variants"))
    expect(variantsCall).toBe("/api/catalog/variants?documentId=doc-1")
  })
})
