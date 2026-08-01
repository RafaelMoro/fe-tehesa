import { renderToString } from "react-dom/server"

import { render, screen, userEvent, waitFor, within } from "@__tests__/test-utils"
import { Providers } from "@/app/providers"
import { QuotePage } from "@/features/QuotePage/QuotePage"
import {
  CART_SCHEMA_VERSION,
  CART_STORAGE_KEY,
} from "@/shared/constants/cart.constants"
import type { CartLine, CartVariantLine } from "@/shared/types/global.types"

const variantLine = (
  overrides: Partial<CartVariantLine> = {},
): CartVariantLine => ({
  productDocumentId: "prod-1",
  productName: "Tornillo",
  quantity: 1,
  variantDocumentId: "variant-1",
  diameter: "1/4 in",
  unitPrice: 10,
  ...overrides,
})

const seedCart = (lines: CartLine[]) => {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      state: { lines, contact: null },
      version: CART_SCHEMA_VERSION,
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe("QuotePage hydration gate", () => {
  it("never renders the empty-state copy before mount", () => {
    const html = renderToString(
      <Providers>
        <QuotePage />
      </Providers>,
    )

    expect(html).not.toContain("Tu lista está vacía")
  })

  it("shows the populated list after mount, never the empty copy", async () => {
    seedCart([variantLine()])

    render(<QuotePage />)

    expect(await screen.findByText("Tornillo")).toBeInTheDocument()
    expect(screen.queryByText("Tu lista está vacía")).not.toBeInTheDocument()
  })

  it("renders the empty state when storage is empty", async () => {
    render(<QuotePage />)

    expect(await screen.findByText("Tu lista está vacía")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Volver al catálogo" }),
    ).toHaveAttribute("href", "/")
  })
})

describe("QuotePage line list", () => {
  it("updates the subtotal when a quantity changes", async () => {
    const user = userEvent.setup()
    seedCart([
      variantLine({
        productDocumentId: "prod-1",
        productName: "Tornillo",
        unitPrice: 10,
        quantity: 1,
      }),
      variantLine({
        productDocumentId: "prod-2",
        productName: "Tuerca",
        variantDocumentId: "variant-2",
        diameter: "1/2 in",
        unitPrice: 5,
        quantity: 1,
      }),
    ])

    render(<QuotePage />)
    await screen.findByText("Tornillo")

    expect(screen.getByText("$15.00 MXN")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", {
        name: "Aumentar Cantidad de Tornillo, 1/4 in",
      }),
    )

    expect(screen.getByText("$25.00 MXN")).toBeInTheDocument()
    expect(screen.queryByText("$15.00 MXN")).not.toBeInTheDocument()
  })

  it("removes one line via Quitar and keeps the other", async () => {
    const user = userEvent.setup()
    seedCart([
      variantLine({ productDocumentId: "prod-1", productName: "Tornillo" }),
      variantLine({
        productDocumentId: "prod-2",
        productName: "Tuerca",
        variantDocumentId: "variant-2",
        diameter: "1/2 in",
      }),
    ])

    render(<QuotePage />)
    await screen.findByText("Tornillo")

    await user.click(
      screen.getByRole("button", { name: "Quitar Tornillo, 1/4 in" }),
    )

    expect(screen.queryByText("Tornillo")).not.toBeInTheDocument()
    expect(screen.getByText("Tuerca")).toBeInTheDocument()
  })

  it("gives each line distinct accessible names", async () => {
    seedCart([
      variantLine({ productDocumentId: "prod-1", productName: "Tornillo" }),
      variantLine({
        productDocumentId: "prod-2",
        productName: "Tuerca",
        variantDocumentId: "variant-2",
        diameter: "1/2 in",
      }),
    ])

    render(<QuotePage />)
    await screen.findByText("Tornillo")

    expect(
      screen.getByRole("button", { name: "Quitar Tornillo, 1/4 in" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Quitar Tuerca, 1/2 in" }),
    ).toBeInTheDocument()
  })

  it("does not render internalId anywhere on the page", async () => {
    seedCart([variantLine({ internalId: "SKU-SECRET-123" })])

    render(<QuotePage />)
    await screen.findByText("Tornillo")

    expect(screen.queryByText("SKU-SECRET-123")).not.toBeInTheDocument()
  })

  it("does not render the subtotal block when the cart is empty", async () => {
    render(<QuotePage />)
    await screen.findByText("Tu lista está vacía")

    expect(
      screen.queryByText("Subtotal estimado (líneas con precio)"),
    ).not.toBeInTheDocument()
  })
})

describe("Vaciar lista", () => {
  it("opens an alertdialog named ¿Vaciar la lista?", async () => {
    const user = userEvent.setup()
    seedCart([variantLine()])
    render(<QuotePage />)
    await screen.findByText("Tornillo")

    await user.click(
      screen.getAllByRole("button", { name: "Vaciar lista" })[0],
    )

    expect(
      await screen.findByRole("alertdialog", { name: "¿Vaciar la lista?" }),
    ).toBeInTheDocument()
  })

  it("Cancelar keeps every line", async () => {
    const user = userEvent.setup()
    seedCart([variantLine()])
    render(<QuotePage />)
    await screen.findByText("Tornillo")

    await user.click(
      screen.getAllByRole("button", { name: "Vaciar lista" })[0],
    )
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }))

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    )
    expect(screen.getByText("Tornillo")).toBeInTheDocument()
  })

  it("the danger action empties the list and reveals the empty state", async () => {
    const user = userEvent.setup()
    seedCart([variantLine()])
    render(<QuotePage />)
    await screen.findByText("Tornillo")

    await user.click(
      screen.getAllByRole("button", { name: "Vaciar lista" })[0],
    )
    const dialog = await screen.findByRole("alertdialog")
    await user.click(
      within(dialog).getByRole("button", { name: "Vaciar lista" }),
    )

    expect(await screen.findByText("Tu lista está vacía")).toBeInTheDocument()
  })

  it("Esc closes without clearing the list", async () => {
    const user = userEvent.setup()
    seedCart([variantLine()])
    render(<QuotePage />)
    await screen.findByText("Tornillo")

    await user.click(
      screen.getAllByRole("button", { name: "Vaciar lista" })[0],
    )
    await screen.findByRole("alertdialog")
    await user.keyboard("{Escape}")

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    )
    expect(screen.getByText("Tornillo")).toBeInTheDocument()
  })
})
