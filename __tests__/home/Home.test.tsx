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
import { CATALOG_SEARCH_OPEN_EVENT } from "@/shared/constants/catalog.constants"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"

const pushMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

let mockWhatsappNumber: string | undefined = "5215500000000"

jest.mock("@/shared/constants/whatsapp.constants", () => ({
  ...jest.requireActual("@/shared/constants/whatsapp.constants"),
  __esModule: true,
  get WHATSAPP_NUMBER() {
    return mockWhatsappNumber
  },
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
  mockWhatsappNumber = "5215500000000"
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
      screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
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
      screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
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
    // The CTA is disabled while the route transition from the first select is
    // still pending (Home.tsx isBusy = isRoutePending || isLoadingCatalogSearch).
    // Wait for it to re-enable before reopening, or a slow/loaded run can click
    // it while disabled and never see the drawer open.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
      ).toBeEnabled()
    })

    await user.click(
      screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
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

  it("opens the wide-search drawer when the header dispatches the open event", async () => {
    renderHome()

    window.dispatchEvent(new Event(CATALOG_SEARCH_OPEN_EVENT))

    expect(
      await screen.findByRole("dialog", { name: "Búsqueda ampliada" }),
    ).toBeInTheDocument()
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
    const nextLink = screen.getByRole("link", { name: "Página siguiente" })
    expect(nextLink).toHaveAttribute("href", "/?page=2")
    expect(nextLink).toHaveTextContent("Página siguiente")
    expect(
      screen.queryByText(/Llegaste al final de esta lista/),
    ).not.toBeInTheDocument()
  })

  it("shows the end-of-list copy and no Página siguiente link on the last base page", () => {
    renderHome({ currentPage: 7 })

    expect(
      screen.queryByRole("link", { name: "Página siguiente" }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/Llegaste al final de esta lista/),
    ).toBeInTheDocument()
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
    expect(
      screen.queryByText(/Llegaste al final de esta lista/),
    ).not.toBeInTheDocument()
  })

  it("shows the end-of-list copy in filtered mode when there is no next page", () => {
    renderHome({
      catalogMode: "brand",
      catalogValue: "Acme",
      hasNextCatalogPage: false,
    })

    expect(
      screen.getByText(/Llegaste al final de esta lista/),
    ).toBeInTheDocument()
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
    expect(
      screen.getByText(/Llegaste al final de esta lista/),
    ).toBeInTheDocument()
  })

  it("never renders a pagination control with href=\"#\"", () => {
    renderHome()

    screen.getAllByRole("link").forEach((link) => {
      expect(link.getAttribute("href")).not.toBe("#")
    })
  })
})

describe("Home - no results", () => {
  it("shows the trimmed search term and both actions", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.type(
      screen.getByLabelText("Filtrar resultados visibles"),
      "  zzz  ",
    )

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent('Nada con "zzz".')
    expect(
      screen.queryByText("No hay coincidencias en estos productos"),
    ).not.toBeInTheDocument()
    expect(
      within(status).getByRole("button", { name: "Buscar en todo el catálogo" }),
    ).toBeInTheDocument()
    expect(
      within(status).getByRole("button", { name: "Limpiar filtros" }),
    ).toBeInTheDocument()
  })

  it("opens the drawer from the no-results action and restores the grid on clear", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.type(
      screen.getByLabelText("Filtrar resultados visibles"),
      "zzz",
    )

    await user.click(
      within(screen.getByRole("status")).getByRole("button", {
        name: "Buscar en todo el catálogo",
      }),
    )
    expect(
      await screen.findByRole("dialog", { name: "Búsqueda ampliada" }),
    ).toBeInTheDocument()
  })

  it("restores the grid and hint after Limpiar filtros", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.type(
      screen.getByLabelText("Filtrar resultados visibles"),
      "zzz",
    )
    await user.click(
      within(screen.getByRole("status")).getByRole("button", {
        name: "Limpiar filtros",
      }),
    )

    await waitFor(() => {
      expect(screen.getByText("Chain C")).toBeInTheDocument()
    })
    expect(
      screen.getByText(/Escribe el nombre del producto\. Ejemplo:/),
    ).toBeInTheDocument()
  })

  it("shows the filter-only message when a category/brand filter has zero matches", async () => {
    const user = userEvent.setup()
    renderHome({
      categories: [
        { name: "Tubes", customId: "tubes" },
        { name: "Wheels", customId: "wheels" },
      ],
    })

    await user.click(
      screen.getByRole("button", { name: "Filtrar categorías" }),
    )
    await user.click(await screen.findByText("Wheels"))

    expect(screen.getByRole("status")).toHaveTextContent(
      "Ninguno de los productos que estás viendo coincide.",
    )
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

describe("Home - hero", () => {
  it("shows the catalog total on base mode", () => {
    renderHome()

    expect(
      screen.getByText("333 productos en catálogo"),
    ).toBeInTheDocument()
  })

  it("shows the result count on a catalog mode instead of the total", () => {
    renderHome({ catalogMode: "brand", catalogValue: "Acme" })

    expect(screen.getByText("3 productos")).toBeInTheDocument()
    expect(
      screen.queryByText("333 productos en catálogo"),
    ).not.toBeInTheDocument()
  })

  it("opens the Búsqueda ampliada drawer from the hero button", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      screen.getByRole("button", { name: "Buscar en todo el catálogo" }),
    )

    expect(
      await screen.findByRole("dialog", { name: "Búsqueda ampliada" }),
    ).toBeInTheDocument()
  })
})

describe("Home - closing panel", () => {
  it("links to /cotizar", () => {
    renderHome()

    expect(
      screen.getByRole("link", { name: /Ver mi lista de cotización/ }),
    ).toHaveAttribute("href", "/cotizar")
  })

  it("renders the WhatsApp link with the header message when a number is set", () => {
    renderHome()

    const link = screen.getByRole("link", { name: "Cotizar por WhatsApp" })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    expect(link).toHaveAttribute(
      "href",
      buildWhatsappUrl(
        "5215500000000",
        jest.requireActual("@/shared/constants/whatsapp.constants")
          .WHATSAPP_HEADER_MESSAGE,
      ),
    )
  })

  it("hides the WhatsApp link when no number is set", () => {
    mockWhatsappNumber = undefined
    renderHome()

    expect(
      screen.queryByRole("link", { name: "Cotizar por WhatsApp" }),
    ).not.toBeInTheDocument()
  })
})

describe("Home - brand strip", () => {
  it("lists only brands with a BRAND_PAGES entry, in BRAND_PAGES order", () => {
    renderHome({
      brands: [
        { name: "Clevaland", customId: "cleveland" },
        { name: "Marca Libre", customId: "libre" },
        { name: "WESTON", customId: "weston" },
      ],
    })

    const nav = screen.getByRole("navigation", { name: "Marcas en almacén" })
    const links = within(nav).getAllByRole("link", {
      name: (name) => name === "Weston" || name === "Cleveland",
    })
    expect(links.map((link) => link.textContent)).toEqual([
      "Weston",
      "Cleveland",
    ])
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/marcas/weston",
      "/marcas/cleveland",
    ])
    expect(
      within(nav).queryByRole("link", { name: "Marca Libre" }),
    ).not.toBeInTheDocument()
    expect(
      within(nav).getByRole("link", {
        name: /Explorar el catálogo por marca/,
      }),
    ).toHaveAttribute("href", "/marcas")
  })

  it("renders nothing when no brand qualifies", () => {
    renderHome({ brands: [] })

    expect(
      screen.queryByRole("navigation", { name: "Marcas en almacén" }),
    ).not.toBeInTheDocument()
  })
})

describe("Home - filter hint", () => {
  it("shows the hint until a local filter is active, then hides it", async () => {
    const user = userEvent.setup()
    renderHome()

    expect(
      screen.getByText(/Escribe el nombre del producto\. Ejemplo:/),
    ).toBeInTheDocument()

    await user.type(
      screen.getByLabelText("Filtrar resultados visibles"),
      "tire",
    )

    expect(
      screen.queryByText(/Escribe el nombre del producto\. Ejemplo:/),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Limpiar filtros" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }))

    expect(
      screen.getByText(/Escribe el nombre del producto\. Ejemplo:/),
    ).toBeInTheDocument()
  })

  it("shows the updated popover copy while a local filter is active", async () => {
    const user = userEvent.setup()
    renderHome()

    await user.type(
      screen.getByLabelText("Filtrar resultados visibles"),
      "tire",
    )
    await user.click(
      screen.getByRole("button", { name: "¿Qué significa este filtro?" }),
    )

    expect(
      await screen.findByText(
        /Puedes combinar categoría, marca y texto/,
      ),
    ).toBeInTheDocument()
  })
})
