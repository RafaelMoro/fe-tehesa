import { render, screen } from "@__tests__/test-utils"
import { CartCount } from "@/shared/ui/atoms/CartCount"
import { Header } from "@/shared/ui/organisms/Header"
import { useCartStore } from "@/zustand/provider/cart.provider"

const usePathnameMock = jest.fn(() => "/")

jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}))

const CartCountHarness = ({ linesToAdd = 0 }: { linesToAdd?: number }) => {
  const addVariantLines = useCartStore((store) => store.addVariantLines)

  if (linesToAdd > 0) {
    addVariantLines(
      Array.from({ length: linesToAdd }, (_, index) => ({
        productDocumentId: "prod-1",
        productName: "Tornillo",
        quantity: 1,
        variantDocumentId: `variant-${index}`,
        diameter: "1/4 in",
        unitPrice: 10,
      })),
    )
  }

  return <CartCount />
}

beforeEach(() => {
  localStorage.clear()
  usePathnameMock.mockReturnValue("/")
})

describe("CartCount", () => {
  it("renders 0 when the cart is empty", async () => {
    render(<CartCount />)

    expect(
      await screen.findByText("Ver mi lista, 0 artículos"),
    ).toBeInTheDocument()
  })

  it("reflects the line count, not the piece count", async () => {
    render(<CartCountHarness linesToAdd={3} />)

    expect(
      await screen.findByText("Ver mi lista, 3 artículos"),
    ).toBeInTheDocument()
  })

  it("uses singular copy for exactly one line", async () => {
    render(<CartCountHarness linesToAdd={1} />)

    expect(
      await screen.findByText("Ver mi lista, 1 artículo"),
    ).toBeInTheDocument()
  })

  it("shows 99+ above 99 lines", async () => {
    render(<CartCountHarness linesToAdd={100} />)

    expect(
      await screen.findByText("Ver mi lista, 100 artículos"),
    ).toBeInTheDocument()
    expect(screen.getByText("99+")).toBeInTheDocument()
  })

  it("renders as a real link to /cotizar", async () => {
    render(<CartCount />)

    const link = await screen.findByRole("link", {
      name: "Ver mi lista, 0 artículos",
    })
    expect(link).toHaveAttribute("href", "/cotizar")
  })

  it("sets aria-current=page only when already on /cotizar", async () => {
    usePathnameMock.mockReturnValue("/cotizar")
    render(<CartCount />)

    const link = await screen.findByRole("link", {
      name: "Ver mi lista, 0 artículos",
    })
    expect(link).toHaveAttribute("aria-current", "page")
  })

  it("omits aria-current elsewhere", async () => {
    usePathnameMock.mockReturnValue("/")
    render(<CartCount />)

    const link = await screen.findByRole("link", {
      name: "Ver mi lista, 0 artículos",
    })
    expect(link).not.toHaveAttribute("aria-current")
  })
})

describe("Header", () => {
  it("renders the cart control alongside the theme toggle", async () => {
    render(<Header themeFetched="light" />)

    expect(
      await screen.findByText("Ver mi lista, 0 artículos"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button")).toBeInTheDocument()
  })
})
