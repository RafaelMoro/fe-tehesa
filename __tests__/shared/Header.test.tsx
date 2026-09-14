import { render, screen, userEvent, waitFor, within } from "@__tests__/test-utils"
import { Header } from "@/shared/ui/organisms/Header"
import { buildWhatsappUrl } from "@/shared/utils/whatsapp-message.utils"
import type { TaxonomyItem } from "@/shared/types/global.types"

const usePathnameMock = jest.fn(() => "/")
const useSearchParamsMock = jest.fn(() => new URLSearchParams(""))

jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
}))

// WHATSAPP_NUMBER is read per-render in Header, so a getter-backed mock lets
// each test flip the value (mirrors __tests__/cart/WhatsappCta.test.tsx).
let mockWhatsappNumber: string | undefined = "5215500000000"

jest.mock("@/shared/constants/whatsapp.constants", () => ({
  __esModule: true,
  get WHATSAPP_NUMBER() {
    return mockWhatsappNumber
  },
  WHATSAPP_HEADER_MESSAGE:
    "Hola, Tehesa. Necesito una cotización para una medida especial. ¿Me pueden ayudar?",
}))

const categories: TaxonomyItem[] = [
  { name: "Herramienta manual para trabajo pesado en obra industrial", customId: "cat-1" },
  { name: "Tornillería", customId: "cat-2" },
]
const brands: TaxonomyItem[] = [
  { name: "Truper", customId: "brand-1" },
  { name: "Urrea", customId: "brand-2" },
]

beforeEach(() => {
  usePathnameMock.mockReturnValue("/")
  useSearchParamsMock.mockReturnValue(new URLSearchParams(""))
  mockWhatsappNumber = "5215500000000"
})

describe("Header", () => {
  it("renders the wordmark linking to /", () => {
    render(<Header categories={categories} brands={brands} />)

    const wordmark = screen.getByRole("link", { name: "Tehesa, inicio" })
    expect(wordmark).toHaveAttribute("href", "/")
  })

  it("marks Productos active on / and inactive elsewhere", () => {
    const { rerender } = render(<Header categories={categories} brands={brands} />)

    const productosOnHome = screen.getAllByRole("link", { name: "Productos" })[0]
    expect(productosOnHome).toHaveAttribute("href", "/")
    expect(productosOnHome).toHaveAttribute("aria-current", "page")

    usePathnameMock.mockReturnValue("/cotizar")
    rerender(<Header categories={categories} brands={brands} />)

    const productosElsewhere = screen.getAllByRole("link", { name: "Productos" })[0]
    expect(productosElsewhere).not.toHaveAttribute("aria-current")
  })

  it("opens the Categorías dropdown listing every item as disabled", async () => {
    const user = userEvent.setup()
    render(<Header categories={categories} brands={brands} />)

    const trigger = screen.getByRole("button", { name: /Categorías/ })
    expect(trigger).toHaveAttribute("aria-expanded", "false")

    await user.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    const menu = screen.getByRole("menu", { name: "Categorías" })
    const items = within(menu).getAllByRole("menuitem")
    expect(items).toHaveLength(categories.length)
    for (const item of items) {
      expect(item).toHaveAttribute("aria-disabled", "true")
      expect(item).not.toHaveAttribute("href")
    }
  })

  it("highlights the active category from the URL", async () => {
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("mode=category&category=Tornillería"),
    )
    const user = userEvent.setup()
    render(<Header categories={categories} brands={brands} />)

    await user.click(screen.getByRole("button", { name: /Categorías/ }))

    const activeItem = screen.getByRole("menuitem", { name: "Tornillería (actual)" })
    expect(activeItem).toBeInTheDocument()
  })

  it("closes the dropdown on Escape", async () => {
    const user = userEvent.setup()
    render(<Header categories={categories} brands={brands} />)

    const trigger = screen.getByRole("button", { name: /Categorías/ })
    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")

    await user.keyboard("{Escape}")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("hides the Categorías/Marcas triggers when taxonomy is empty", () => {
    render(<Header categories={[]} brands={[]} />)

    expect(screen.queryByRole("button", { name: /Categorías/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Marcas/ })).not.toBeInTheDocument()
  })

  it("renders the cart control and the theme toggle", async () => {
    render(<Header categories={categories} brands={brands} />)

    expect(
      (await screen.findAllByRole("link", { name: "Ver mi lista, 0 artículos" })).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Cambiar tema" }).length).toBeGreaterThan(0)
  })

  it("opens the mobile side menu and returns focus to the hamburger on close", async () => {
    const user = userEvent.setup()
    render(<Header categories={categories} brands={brands} />)

    const hamburger = screen.getByRole("button", { name: "Menú" })
    expect(hamburger).toHaveAttribute("aria-expanded", "false")

    await user.click(hamburger)

    expect(hamburger).toHaveAttribute("aria-expanded", "true")
    const dialog = await screen.findByRole("dialog", { name: "Menú" })
    expect(dialog).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cerrar" }))

    expect(screen.queryByRole("dialog", { name: "Menú" })).not.toBeInTheDocument()
    await waitFor(() => expect(hamburger).toHaveFocus())
  })

  it("closes the side menu on Escape and returns focus to the hamburger", async () => {
    const user = userEvent.setup()
    render(<Header categories={categories} brands={brands} />)

    const hamburger = screen.getByRole("button", { name: "Menú" })
    await user.click(hamburger)
    await screen.findByRole("dialog", { name: "Menú" })

    await user.keyboard("{Escape}")

    expect(screen.queryByRole("dialog", { name: "Menú" })).not.toBeInTheDocument()
    await waitFor(() => expect(hamburger).toHaveFocus())
  })

  it("lists disabled taxonomy rows inside the side menu and highlights the active one", async () => {
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("mode=brand&brand=Urrea"),
    )
    const user = userEvent.setup()
    render(<Header categories={categories} brands={brands} />)

    await user.click(screen.getByRole("button", { name: "Menú" }))
    const dialog = await screen.findByRole("dialog", { name: "Menú" })

    await user.click(within(dialog).getByRole("button", { name: "Marcas" }))

    for (const brand of brands) {
      const row = within(dialog).getByText(brand.name)
      expect(row).toHaveAttribute("aria-disabled", "true")
    }
    expect(within(dialog).getByText("Urrea")).toHaveAttribute("aria-current", "page")
    expect(within(dialog).queryByRole("link", { name: "Urrea" })).not.toBeInTheDocument()
  })

  it("shows the lupa button on / and dispatches the search-open event", async () => {
    const listener = jest.fn()
    window.addEventListener("tehesa:open-catalog-search", listener)
    const user = userEvent.setup()
    render(<Header categories={categories} brands={brands} />)

    const lupa = screen.getByRole("button", { name: "Buscar" })
    await user.click(lupa)

    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener("tehesa:open-catalog-search", listener)
  })

  it("hides the lupa button on routes other than /", () => {
    usePathnameMock.mockReturnValue("/cotizar")
    render(<Header categories={categories} brands={brands} />)

    expect(screen.queryByRole("button", { name: "Buscar" })).not.toBeInTheDocument()
  })

  it("renders the utility bar WhatsApp links with the header message", async () => {
    const user = userEvent.setup()
    render(<Header categories={categories} brands={brands} />)

    const expectedUrl = buildWhatsappUrl(
      "5215500000000",
      "Hola, Tehesa. Necesito una cotización para una medida especial. ¿Me pueden ayudar?",
    )

    const utilityBarLink = screen.getByRole("link", { name: "Solicitar cotización Cotizar" })
    expect(utilityBarLink).toHaveAttribute("href", expectedUrl)
    expect(utilityBarLink).toHaveAttribute("target", "_blank")
    expect(utilityBarLink).toHaveAttribute("rel", "noopener noreferrer")

    await user.click(screen.getByRole("button", { name: "Menú" }))
    const dialog = await screen.findByRole("dialog", { name: "Menú" })
    const footerLink = within(dialog).getByRole("link", { name: "Solicitar cotización" })
    expect(footerLink).toHaveAttribute("href", expectedUrl)
  })

  it("hides both WhatsApp links when the number is unset, without throwing", async () => {
    mockWhatsappNumber = undefined
    const user = userEvent.setup()

    expect(() => render(<Header categories={categories} brands={brands} />)).not.toThrow()

    expect(screen.queryByRole("link", { name: "Solicitar cotización" })).not.toBeInTheDocument()
    expect(screen.getByText("¿Medida especial?")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Menú" }))
    const dialog = await screen.findByRole("dialog", { name: "Menú" })
    expect(
      within(dialog).queryByRole("link", { name: "Solicitar cotización" }),
    ).not.toBeInTheDocument()
  })
})
