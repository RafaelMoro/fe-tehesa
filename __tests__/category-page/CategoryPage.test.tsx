import { render, screen, userEvent, within } from "@__tests__/test-utils"
import { CategoryPage } from "@/features/CategoryPage/CategoryPage"
import type { Product } from "@/shared/types/global.types"

let mockWhatsappNumber: string | undefined = "5215500000000"

jest.mock("@/shared/constants/whatsapp.constants", () => ({
  __esModule: true,
  get WHATSAPP_NUMBER() {
    return mockWhatsappNumber
  },
  WHATSAPP_HEADER_MESSAGE:
    "Hola, Tehesa. Necesito una cotización para una medida especial. ¿Me pueden ayudar?",
}))

beforeEach(() => {
  mockWhatsappNumber = "5215500000000"
})

const products: Product[] = [
  {
    name: "Tornillo hex 1/2",
    documentId: "p1",
    category: { name: "Tornillería" },
    brand: { name: "Acme" },
    subcategory: "tornillos",
    variantCount: 3,
    minPrice: 10,
    maxPrice: 20,
  },
  {
    name: "Tuerca hex 1/2",
    documentId: "p2",
    category: { name: "Tornillería" },
    brand: { name: "Truper" },
    subcategory: "tuerca",
    variantCount: 2,
    minPrice: 5,
    maxPrice: 8,
  },
  {
    name: "Rondana plana",
    documentId: "p3",
    category: { name: "Tornillería" },
    brand: null,
    subcategory: "rondana",
    variantCount: 4,
    minPrice: 1,
    maxPrice: 3,
  },
  {
    name: "Producto sin subcategoría",
    documentId: "p4",
    category: { name: "Tornillería" },
    brand: { name: "Acme" },
    subcategory: null,
    variantCount: 1,
    minPrice: 15,
    maxPrice: 15,
  },
]

describe("CategoryPage", () => {
  it("renders the breadcrumb and H1", () => {
    render(<CategoryPage products={products} />)

    const nav = screen.getByRole("navigation", { name: "Ruta" })
    expect(within(nav).getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      "/",
    )
    expect(
      within(nav).getByRole("link", { name: "Categorías" }),
    ).toHaveAttribute("href", "/categorias")
    expect(within(nav).getByText("Tornillería")).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Tornillería y fijación industrial",
      }),
    ).toBeInTheDocument()
  })

  it("shows the counter for the full set and singular form after a filter", async () => {
    const user = userEvent.setup()
    render(<CategoryPage products={products} />)

    expect(screen.getByText("4 productos")).toBeInTheDocument()

    await user.type(
      screen.getByLabelText("Filtrar resultados visibles"),
      "Rondana",
    )
    expect(screen.getByText("1 producto")).toBeInTheDocument()
  })

  it("lists only subcategories present in the data, as labels, A→Z, and skips null brand", async () => {
    const user = userEvent.setup()
    render(<CategoryPage products={products} />)

    await user.click(screen.getByRole("button", { name: "Filtrar subcategorías" }))
    const subcategoryMenu = screen.getByRole("menu")
    const subcategoryNames = within(subcategoryMenu)
      .getAllByRole("menuitem")
      .map((item) => item.textContent)
    expect(subcategoryNames).toEqual(["Rondanas", "Tornillos", "Tuercas"])
    await user.keyboard("{Escape}")

    await user.click(screen.getByRole("button", { name: "Filtrar marcas" }))
    const brandMenu = screen.getByRole("menu")
    const brandNames = within(brandMenu)
      .getAllByRole("menuitem")
      .map((item) => item.textContent)
    expect(brandNames).toEqual(["Acme", "Truper"])
  })

  it("stacks search, subcategory, and brand filters and clears them together", async () => {
    const user = userEvent.setup()
    render(<CategoryPage products={products} />)

    await user.type(
      screen.getByLabelText("Filtrar resultados visibles"),
      "hex",
    )
    await user.click(screen.getByRole("button", { name: "Filtrar subcategorías" }))
    await user.click(screen.getByRole("menuitem", { name: "Tornillos" }))
    await user.click(screen.getByRole("button", { name: "Filtrar marcas" }))
    await user.click(screen.getByRole("menuitem", { name: "Acme" }))

    expect(screen.getByText("1 producto")).toBeInTheDocument()
    expect(screen.getByText("Tornillo hex 1/2")).toBeInTheDocument()

    const clearButton = screen.getByRole("button", { name: "Limpiar filtros" })
    expect(clearButton).toBeInTheDocument()
    await user.click(clearButton)

    expect(screen.getByText("4 productos")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Limpiar filtros" }),
    ).not.toBeInTheDocument()
  })

  it("shows the no-match state without the wide-search action when nothing matches", async () => {
    const user = userEvent.setup()
    render(<CategoryPage products={products} />)

    await user.type(
      screen.getByLabelText("Filtrar resultados visibles"),
      "zzz-no-match",
    )

    expect(
      screen.getByRole("heading", { name: "No hay coincidencias en estos productos" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Buscar en todo el catálogo" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        "La búsqueda incluirá productos fuera de la selección actual.",
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: "Limpiar filtros" }).length,
    ).toBeGreaterThan(0)
  })

  it("renders the empty catalog state when products is empty", () => {
    render(<CategoryPage products={[]} />)
    expect(screen.getByText("No hay productos disponibles.")).toBeInTheDocument()
  })

  it("renders the WhatsApp panel and hides it when the number is unset", () => {
    const { rerender } = render(<CategoryPage products={products} />)
    expect(screen.getByRole("link", { name: "Cotizar ahora" })).toBeInTheDocument()

    mockWhatsappNumber = undefined
    rerender(<CategoryPage products={products} />)
    expect(
      screen.queryByRole("link", { name: "Cotizar ahora" }),
    ).not.toBeInTheDocument()
  })

  it("opens the variants drawer from a card CTA", async () => {
    const user = userEvent.setup()
    render(<CategoryPage products={products} />)

    await user.click(
      screen.getByRole("button", { name: "Explorar las 3 variantes" }),
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
