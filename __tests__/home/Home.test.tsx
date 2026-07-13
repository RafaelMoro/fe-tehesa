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
  it("renders pages 1-7 and pushes page 6 and 7 URLs", async () => {
    const user = userEvent.setup()
    renderHome()

    expect(screen.getByRole("button", { name: "7" })).toBeInTheDocument()
    expect(screen.getByText(/Mostrando/)).toHaveTextContent(
      "Mostrando 1-3 de 333 productos",
    )

    await user.click(screen.getByRole("button", { name: "6" }))
    expect(pushMock).toHaveBeenLastCalledWith("/?page=6")

    await user.click(screen.getByRole("button", { name: "7" }))
    expect(pushMock).toHaveBeenLastCalledWith("/?page=7")
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    })
  })

  it("uses canonical wide Previous and Next URLs", async () => {
    const user = userEvent.setup()
    renderHome({
      catalogMode: "category",
      catalogValue: "Tubos PVC",
      catalogPage: 2,
      hasPreviousCatalogPage: true,
      hasNextCatalogPage: true,
    })

    await user.click(screen.getByRole("button", { name: "Anterior" }))
    expect(pushMock).toHaveBeenLastCalledWith(
      "/?mode=category&category=Tubos%20PVC&page=1",
    )

    await user.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(pushMock).toHaveBeenLastCalledWith(
      "/?mode=category&category=Tubos%20PVC&page=3",
    )
  })

  it("shows notice=end feedback and disables Next", () => {
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
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled()
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
