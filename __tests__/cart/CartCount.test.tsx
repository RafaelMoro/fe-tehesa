import { render, screen } from "@__tests__/test-utils"
import { CartCount } from "@/shared/ui/atoms/CartCount"
import { Header } from "@/shared/ui/organisms/Header"
import { useCartStore } from "@/zustand/provider/cart.provider"

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
})

describe("CartCount", () => {
  it("renders 0 when the cart is empty", async () => {
    render(<CartCount />)

    expect(await screen.findByText("Mi lista, 0 artículos")).toBeInTheDocument()
  })

  it("reflects the line count, not the piece count", async () => {
    render(<CartCountHarness linesToAdd={3} />)

    expect(
      await screen.findByText("Mi lista, 3 artículos"),
    ).toBeInTheDocument()
  })

  it("uses singular copy for exactly one line", async () => {
    render(<CartCountHarness linesToAdd={1} />)

    expect(await screen.findByText("Mi lista, 1 artículo")).toBeInTheDocument()
  })

  it("shows 99+ above 99 lines", async () => {
    render(<CartCountHarness linesToAdd={100} />)

    expect(
      await screen.findByText("Mi lista, 100 artículos"),
    ).toBeInTheDocument()
    expect(screen.getByText("99+")).toBeInTheDocument()
  })

  it("is not reachable by Tab and exposes no link or button role", async () => {
    render(<CartCount />)
    await screen.findByText("Mi lista, 0 artículos")

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})

describe("Header", () => {
  it("renders the cart control alongside the theme toggle", async () => {
    render(<Header themeFetched="light" />)

    expect(await screen.findByText("Mi lista, 0 artículos")).toBeInTheDocument()
    expect(screen.getByRole("button")).toBeInTheDocument()
  })
})
