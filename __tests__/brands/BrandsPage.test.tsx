import { render, screen, within } from "@__tests__/test-utils"
import { BrandsPage } from "@/features/BrandsPage/BrandsPage"
import { BRAND_PAGES } from "@/shared/constants/brand.constants"
import { CATEGORY_PAGE_HREFS } from "@/shared/constants/category.constants"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"
import type { BrandCardItem } from "@/features/BrandsPage/BrandCard"

let mockWhatsappNumber: string | undefined = "5215500000000"

jest.mock("@/shared/constants/whatsapp.constants", () => ({
  __esModule: true,
  get WHATSAPP_NUMBER() {
    return mockWhatsappNumber
  },
  WHATSAPP_BRANDS_MESSAGE: "Hola, busco una marca que no veo en el catálogo de Tehesa: ",
}))

beforeEach(() => {
  mockWhatsappNumber = "5215500000000"
})

const brands: BrandCardItem[] = [
  { customId: "weston", ...BRAND_PAGES.weston },
  { customId: "king-tony", ...BRAND_PAGES["king-tony"] },
  { customId: "bohrcraft", ...BRAND_PAGES.bohrcraft },
]

describe("BrandsPage", () => {
  it("renders one article per brand in fixture order with name, origin, identity, stock and tags", () => {
    render(<BrandsPage brands={brands} />)

    const articles = screen.getAllByRole("article")
    expect(articles).toHaveLength(3)
    expect(
      articles.map((article) => within(article).getByRole("heading", { level: 2 }).textContent),
    ).toEqual(["WESTON", "KING TONY", "BOHRCRAFT"])

    for (const brand of brands) {
      expect(screen.getByText(brand.origin)).toBeInTheDocument()
      expect(screen.getByText(brand.identity)).toBeInTheDocument()
      expect(screen.getByText(brand.stock)).toBeInTheDocument()
      for (const tag of brand.tags) {
        expect(screen.getAllByText(tag).length).toBeGreaterThan(0)
      }
    }
    expect(screen.getAllByText("En almacén")).toHaveLength(3)
  })

  it("renders every Ver productos CTA as a link to /marcas/<slug>", () => {
    const { container } = render(<BrandsPage brands={brands} />)

    const links = screen.getAllByRole("link", { name: /Ver productos/ })
    expect(links).toHaveLength(3)
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/marcas/weston",
      "/marcas/king-tony",
      "/marcas/bohrcraft",
    ])
    for (const link of links) {
      expect(link).not.toHaveAttribute("aria-disabled")
    }
    for (const article of screen.getAllByRole("article")) {
      expect(within(article).getAllByRole("link")).toHaveLength(1)
    }
    expect(container.querySelector('a[href="#"]')).toBeNull()
  })

  it("shows the pluralised counter and hero/breadcrumb copy", () => {
    render(<BrandsPage brands={brands} />)

    expect(screen.getByText("3 marcas en almacén")).toBeInTheDocument()
    expect(screen.getByText("Ordenadas por fondo de catálogo")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: "Explora el catálogo por marca" }),
    ).toBeInTheDocument()

    const nav = screen.getByRole("navigation", { name: "Ruta" })
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/")
    expect(nav).toHaveTextContent("Marcas")
    expect(screen.getByText("Marcas")).toHaveAttribute("aria-current", "page")
  })

  it("pluralises a single brand as 1 marca en almacén", () => {
    render(<BrandsPage brands={[brands[0]]} />)

    expect(screen.getByText("1 marca en almacén")).toBeInTheDocument()
  })

  it("links the tornillería note and the category panel button, and gates the WhatsApp CTA", () => {
    render(<BrandsPage brands={brands} />)

    expect(screen.getByRole("link", { name: "búscala por categoría" })).toHaveAttribute(
      "href",
      CATEGORY_PAGE_HREFS.tornilleria,
    )
    expect(screen.getByRole("link", { name: "Buscar por categoría" })).toHaveAttribute(
      "href",
      "/categorias",
    )

    const whatsappCta = screen.getByRole("link", { name: "Cotizar por WhatsApp" })
    expect(whatsappCta).toHaveAttribute(
      "href",
      buildWhatsappUrl(
        "5215500000000",
        "Hola, busco una marca que no veo en el catálogo de Tehesa: ",
      ),
    )
    expect(whatsappCta).toHaveAttribute("target", "_blank")
    expect(whatsappCta).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("hides the WhatsApp CTA without throwing when the number is unset, keeping the category button", () => {
    mockWhatsappNumber = undefined

    expect(() => render(<BrandsPage brands={brands} />)).not.toThrow()

    expect(
      screen.queryByRole("link", { name: "Cotizar por WhatsApp" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Buscar por categoría" })).toBeInTheDocument()
  })

  it("renders the empty state with zero articles and 0 marcas en almacén", () => {
    render(<BrandsPage brands={[]} />)

    expect(screen.getByText("No hay marcas disponibles por ahora.")).toBeInTheDocument()
    expect(screen.getByText("0 marcas en almacén")).toBeInTheDocument()
    expect(screen.queryAllByRole("article")).toHaveLength(0)
    expect(screen.getByText("¿No ves tu marca?")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Buscar por categoría" })).toBeInTheDocument()
  })
})
