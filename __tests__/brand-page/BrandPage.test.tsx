import { render, screen, userEvent, within } from "@__tests__/test-utils"
import { BrandPage } from "@/features/BrandPage/BrandPage"
import { BRAND_PAGES } from "@/shared/constants/brand.constants"
import { BRAND_SEO } from "@/shared/constants/seo.constants"
import type { Product } from "@/shared/types/global.types"

const config = BRAND_PAGES["weston"]
const heading = BRAND_SEO["weston"].heading

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
    name: "Broca 1/2",
    documentId: "p1",
    category: { name: "Brocas" },
    brand: { name: "Weston" },
    variantCount: 3,
    minPrice: 10,
    maxPrice: 20,
  },
  {
    name: "Machuelo 3/8",
    documentId: "p2",
    category: { name: "Machuelos" },
    brand: { name: "Weston" },
    variantCount: 2,
    minPrice: 5,
    maxPrice: 8,
  },
  {
    name: "Broqueros 5/8",
    documentId: "p3",
    category: { name: "Brocas" },
    brand: { name: "Weston" },
    variantCount: 4,
    minPrice: 1,
    maxPrice: 3,
  },
  {
    name: "Producto sin categoría",
    documentId: "p4",
    category: null,
    brand: { name: "Weston" },
    variantCount: 1,
    minPrice: 15,
    maxPrice: 15,
  },
]

describe("BrandPage", () => {
  it("renders the breadcrumb, kicker, H1, and intro paragraphs", () => {
    render(
      <BrandPage
        products={products}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )

    const nav = screen.getByRole("navigation", { name: "Ruta" })
    expect(within(nav).getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      "/",
    )
    expect(within(nav).getByRole("link", { name: "Marcas" })).toHaveAttribute(
      "href",
      "/marcas",
    )
    expect(within(nav).getByText("Weston")).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByText("Marca")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument()
    expect(screen.getByText(config.identity)).toBeInTheDocument()
    expect(screen.getByText(config.stock)).toBeInTheDocument()
  })

  it("shows the counter for the full set and singular form after a search", async () => {
    const user = userEvent.setup()
    render(
      <BrandPage
        products={products}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )

    expect(screen.getByText("4 productos")).toBeInTheDocument()

    await user.type(
      screen.getByLabelText("Filtrar resultados visibles"),
      "Machuelo",
    )
    expect(screen.getByText("1 producto")).toBeInTheDocument()
  })

  it("lists only categories present in the data, A→Z, and skips null category", async () => {
    const user = userEvent.setup()
    render(
      <BrandPage
        products={products}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Filtrar categorías" }))
    const categoryMenu = screen.getByRole("menu")
    const categoryNames = within(categoryMenu)
      .getAllByRole("menuitem")
      .map((item) => item.textContent)
    expect(categoryNames).toEqual(["Brocas", "Machuelos"])
  })

  it("stacks search and category filters and clears them together", async () => {
    const user = userEvent.setup()
    render(
      <BrandPage
        products={products}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )

    await user.type(screen.getByLabelText("Filtrar resultados visibles"), "5")
    await user.click(screen.getByRole("button", { name: "Filtrar categorías" }))
    await user.click(screen.getByRole("menuitem", { name: "Brocas" }))

    expect(screen.getByText("1 producto")).toBeInTheDocument()
    expect(screen.getByText("Broqueros 5/8")).toBeInTheDocument()

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
    render(
      <BrandPage
        products={products}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )

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
  })

  it("hides the category dropdown when every product shares one category", () => {
    const singleCategoryProducts = products.map((product) => ({
      ...product,
      category: { name: "Brocas" },
    }))
    render(
      <BrandPage
        products={singleCategoryProducts}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )

    expect(
      screen.queryByRole("button", { name: "Filtrar categorías" }),
    ).not.toBeInTheDocument()
  })

  it("hides the category dropdown when every product has a null category", () => {
    const noCategoryProducts = products.map((product) => ({
      ...product,
      category: null,
    }))
    render(
      <BrandPage
        products={noCategoryProducts}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )

    expect(
      screen.queryByRole("button", { name: "Filtrar categorías" }),
    ).not.toBeInTheDocument()
  })

  it("renders the WhatsApp panel and hides it when the number is unset", () => {
    const { rerender } = render(
      <BrandPage
        products={products}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )
    expect(screen.getByRole("link", { name: "Cotizar ahora" })).toBeInTheDocument()

    mockWhatsappNumber = undefined
    rerender(
      <BrandPage
        products={products}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )
    expect(
      screen.queryByRole("link", { name: "Cotizar ahora" }),
    ).not.toBeInTheDocument()
  })

  it("opens the variants drawer from a card CTA", async () => {
    const user = userEvent.setup()
    render(
      <BrandPage
        products={products}
        displayName="Weston"
        heading={heading}
        config={config}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Explorar las 3 variantes" }),
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
