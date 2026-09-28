import { render, screen, within } from "@__tests__/test-utils"
import { BrandsPage } from "@/features/BrandsPage/BrandsPage"
import { BRAND_PAGES, BRANDS_HERO_PHOTO, BRANDS_INDEX_ORDER } from "@/shared/constants/brand.constants"
import { CATEGORY_PAGE_HREFS } from "@/shared/constants/category.constants"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"

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

const ALL = [...Object.keys(BRAND_PAGES), "libre"]
const WITHOUT_FEATURED = ALL.filter((id) => id !== "bohrcraft")

describe("BrandsPage", () => {
  it("renders the hero breadcrumb, kicker, H1, paragraph, and photo, with the old copy gone", () => {
    render(<BrandsPage liveBrandIds={ALL} />)

    const nav = screen.getByRole("navigation", { name: "Ruta" })
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/")
    expect(nav).toHaveTextContent("Marcas")
    expect(screen.getByText("Marcas")).toHaveAttribute("aria-current", "page")

    expect(screen.getByText("Distribuidor directo")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: "Marcas que distribuimos" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "En más de 20 años abasteciendo a la industria poblana, hemos elegido trabajar con las marcas que resisten el uso exigente. Somos distribuidores directos: eso significa mejor precio, existencia real y respaldo técnico sobre cada herramienta que sale de nuestro almacén.",
      ),
    ).toBeInTheDocument()

    const heroPhoto = screen.getByRole("img", { name: BRANDS_HERO_PHOTO.alt })
    expect(heroPhoto).toHaveAttribute("src", BRANDS_HERO_PHOTO.src)
    expect(heroPhoto).not.toHaveAttribute("loading")

    expect(screen.queryByText("Explora el catálogo por marca")).not.toBeInTheDocument()
    expect(screen.queryByText(/marcas? en almacén/)).not.toBeInTheDocument()
    expect(screen.queryByText("Ordenadas por fondo de catálogo")).not.toBeInTheDocument()
  })

  it("renders the featured Bohrcraft panel when Bohrcraft is live, excluded from the grid", () => {
    render(<BrandsPage liveBrandIds={ALL} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "BOHRCRAFT — Precisión alemana" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Marca diferenciadora")).toBeInTheDocument()
    expect(
      screen.getByText(/Nuestra marca diferenciadora\. Bohrcraft fabrica en Alemania/),
    ).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Bohrcraft" })).toBeInTheDocument()

    const cta = screen.getByRole("link", { name: "Ver catálogo Bohrcraft" })
    expect(cta).toHaveAttribute("href", "/marcas/bohrcraft")

    expect(
      screen.queryByRole("heading", { level: 3, name: "BOHRCRAFT" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryAllByRole("link", { name: "Ver productos" }).map((link) => link.getAttribute("href")),
    ).not.toContain("/marcas/bohrcraft")
  })

  it("renders the grid in design order with logo, content, and one CTA-only link per card", () => {
    render(<BrandsPage liveBrandIds={ALL} />)

    const articles = screen.getAllByRole("article")
    expect(articles).toHaveLength(6)

    const expectedNames = BRANDS_INDEX_ORDER.map((id) => BRAND_PAGES[id].name)
    expect(expectedNames).toEqual([
      "WESTON",
      "KING TONY",
      "BONDHUS",
      "PRECISION BRAND",
      "CLEVELAND",
      "VÖLKEL",
    ])
    expect(
      articles.map((article) => within(article).getByRole("heading", { level: 3 }).textContent),
    ).toEqual(expectedNames)

    for (const id of BRANDS_INDEX_ORDER) {
      const config = BRAND_PAGES[id]

      expect(screen.getByRole("img", { name: config.name })).toBeInTheDocument()
      expect(screen.getByText(config.origin)).toBeInTheDocument()
      expect(screen.getByText(config.identity)).toBeInTheDocument()
      expect(screen.getByText(config.stock)).toBeInTheDocument()
      for (const tag of config.tags) {
        expect(screen.getAllByText(tag).length).toBeGreaterThan(0)
      }
    }

    for (const article of articles) {
      expect(within(article).getAllByRole("link")).toHaveLength(1)
    }
    expect(screen.getAllByText("En almacén")).toHaveLength(6)

    expect(
      screen.getByRole("heading", { level: 2, name: "El resto del catálogo" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Cada marca abre el catálogo filtrado")).toBeInTheDocument()
  })

  it("hides the featured panel when Bohrcraft is not live, keeping the grid", () => {
    render(<BrandsPage liveBrandIds={WITHOUT_FEATURED} />)

    expect(
      screen.queryByRole("heading", { level: 2, name: "BOHRCRAFT — Precisión alemana" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Ver catálogo Bohrcraft" })).not.toBeInTheDocument()

    expect(
      screen.getByRole("heading", { level: 2, name: "El resto del catálogo" }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(6)
  })

  it("shows only the featured panel, no grid heading and no articles, when Bohrcraft is the only live brand", () => {
    render(<BrandsPage liveBrandIds={["bohrcraft"]} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "BOHRCRAFT — Precisión alemana" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { level: 2, name: "El resto del catálogo" }),
    ).not.toBeInTheDocument()
    expect(screen.queryAllByRole("article")).toHaveLength(0)
    expect(screen.queryByText("No hay marcas disponibles por ahora.")).not.toBeInTheDocument()
  })

  it("renders the empty state with no panel, no grid heading, and no articles when zero brands are live", () => {
    render(<BrandsPage liveBrandIds={[]} />)

    expect(screen.getByText("No hay marcas disponibles por ahora.")).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { level: 2, name: "BOHRCRAFT — Precisión alemana" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { level: 2, name: "El resto del catálogo" }),
    ).not.toBeInTheDocument()
    expect(screen.queryAllByRole("article")).toHaveLength(0)

    expect(
      screen.getByRole("heading", { level: 1, name: "Marcas que distribuimos" }),
    ).toBeInTheDocument()
    expect(screen.getByText("¿No ves tu marca?")).toBeInTheDocument()
  })

  it("links the tornillería note and the category panel button, and gates the WhatsApp CTA", () => {
    render(<BrandsPage liveBrandIds={ALL} />)

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

    expect(() => render(<BrandsPage liveBrandIds={ALL} />)).not.toThrow()

    expect(
      screen.queryByRole("link", { name: "Cotizar por WhatsApp" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Buscar por categoría" })).toBeInTheDocument()
  })
})
