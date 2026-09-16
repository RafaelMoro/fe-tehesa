import { render, screen } from "@__tests__/test-utils"
import { CategoriesPage } from "@/features/CategoriesPage/CategoriesPage"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"
import type { CategoryWithCount } from "@/shared/types/global.types"

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

const categories: CategoryWithCount[] = [
  { name: "Abrasivos", customId: "abrasivos", productCount: 0 },
  { name: "Tornillería", customId: "tornilleria", productCount: 1234 },
  { name: "Sujeción", customId: "sujecion", productCount: null },
  {
    name: "Herramientas de impacto o forja",
    customId: "herramientas-impacto-forja",
    productCount: 2,
  },
  {
    name: "Herramientas de corte y conformado",
    customId: "herramientas-corte-conformado",
    productCount: 75,
  },
  {
    name: "Perforación y accesorios para taladro",
    customId: "perforacion-accesorios-taladro",
    productCount: 51,
  },
]

describe("CategoriesPage", () => {
  it("renders one article per category with an h2 name; the Tornillería, Abrasivos, Impacto/Forja, Corte/Conformado, and Perforación CTAs are links, the others stay disabled", () => {
    render(<CategoriesPage categories={categories} />)

    const articles = screen.getAllByRole("article")
    expect(articles).toHaveLength(categories.length)
    for (const category of categories) {
      expect(
        screen.getByRole("heading", { level: 2, name: category.name }),
      ).toBeInTheDocument()
    }

    const linkCtas = screen.getAllByRole("link", { name: "Ver categoría" })
    const hrefs = linkCtas.map((cta) => cta.getAttribute("href"))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/categorias/tornilleria-fijacion",
        "/categorias/abrasivos",
        "/categorias/impacto-forja",
        "/categorias/herramientas-corte-conformado",
        "/categorias/perforacion-accesorios-taladro",
      ]),
    )
    expect(linkCtas).toHaveLength(5)

    const ctas = screen.getAllByText("Ver categoría")
    const disabledCtas = ctas.filter((cta) => !linkCtas.includes(cta))
    expect(disabledCtas).toHaveLength(categories.length - 5)
    for (const cta of disabledCtas) {
      expect(cta).toHaveAttribute("aria-disabled", "true")
      expect(cta.tagName).not.toBe("A")
    }
  })

  it("shows the product count pill, 0 productos, and hides the pill when the count is null", () => {
    render(<CategoriesPage categories={categories} />)

    expect(screen.getByText("1,234 productos")).toBeInTheDocument()
    expect(screen.getByText("0 productos")).toBeInTheDocument()
    expect(screen.getByText("2 productos")).toBeInTheDocument()
    expect(screen.getByText("75 productos")).toBeInTheDocument()
    expect(screen.getByText("51 productos")).toBeInTheDocument()
    expect(screen.queryAllByText(/productos$/)).toHaveLength(5)
  })

  it("shows the hero/counter category count and the breadcrumb", () => {
    render(<CategoriesPage categories={categories} />)

    expect(screen.getAllByText(/6 categorías/).length).toBeGreaterThan(0)
    const nav = screen.getByRole("navigation", { name: "Ruta" })
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/")
    expect(nav).toHaveTextContent("Categorías")
    expect(screen.getByText("Categorías")).toHaveAttribute("aria-current", "page")
  })

  it("renders the WhatsApp panel with the correct href, target, and rel", () => {
    render(<CategoriesPage categories={categories} />)

    const cta = screen.getByRole("link", { name: "Cotizar ahora" })
    expect(cta).toHaveAttribute(
      "href",
      buildWhatsappUrl(
        "5215500000000",
        "Hola, Tehesa. Necesito una cotización para una medida especial. ¿Me pueden ayudar?",
      ),
    )
    expect(cta).toHaveAttribute("target", "_blank")
    expect(cta).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("hides the WhatsApp panel without throwing when the number is unset", () => {
    mockWhatsappNumber = undefined

    expect(() => render(<CategoriesPage categories={categories} />)).not.toThrow()

    expect(screen.queryByRole("link", { name: "Cotizar ahora" })).not.toBeInTheDocument()
    expect(screen.queryByText("Cotiza por WhatsApp")).not.toBeInTheDocument()
  })

  it("renders the empty state with zero articles when categories is empty", () => {
    render(<CategoriesPage categories={[]} />)

    expect(screen.getByText("No hay categorías disponibles por ahora.")).toBeInTheDocument()
    expect(screen.queryAllByRole("article")).toHaveLength(0)
  })
})
