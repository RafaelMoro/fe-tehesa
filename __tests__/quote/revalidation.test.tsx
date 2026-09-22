import { toast } from "@heroui/react"

import { render, screen, userEvent, waitFor } from "@__tests__/test-utils"
import { QuotePage } from "@/features/QuotePage/QuotePage"
import {
  CART_SCHEMA_VERSION,
  CART_STORAGE_KEY,
} from "@/shared/constants/cart.constants"
import type { CartLine, CartVariantLine } from "@/shared/types/global.types"
import type { CatalogEnvelope } from "@/shared/utils/catalog-api.utils"

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

const originalFetch = globalThis.fetch
const originalResizeObserver = globalThis.ResizeObserver

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const jsonResponse = <T,>(body: CatalogEnvelope<T>) =>
  ({ json: async () => body }) as Response

const mockFetch = () => {
  const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>()
  globalThis.fetch = fetchMock as typeof fetch
  return fetchMock
}

let fetchMock: ReturnType<typeof mockFetch>

beforeEach(() => {
  localStorage.clear()
  globalThis.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver
  fetchMock = mockFetch()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  globalThis.ResizeObserver = originalResizeObserver
  toast.clear()
})

describe("useQuoteRevalidation / QuotePage check banner", () => {
  it("shows the checking status, then removes it once resolved, without disabling steppers", async () => {
    let resolveFetch: (value: Response) => void = () => {}
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    seedCart([variantLine()])

    render(<QuotePage />)

    const statuses = await screen.findAllByRole("status")
    const checkingStatus = statuses.find((node) =>
      node.textContent?.includes("Comprobando precios"),
    )
    expect(checkingStatus).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Aumentar Cantidad de Tornillo, 1/4 in",
      }),
    ).toBeEnabled()

    resolveFetch(
      jsonResponse({
        success: true,
        data: {
          variants: [
            { documentId: "variant-1", diameter: "1/4 in", pricing: { price: 10 } },
          ],
          products: [{ documentId: "prod-1", name: "Tornillo" }],
        },
      }),
    )

    await waitFor(() =>
      expect(
        screen.queryByText("Comprobando precios…"),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole("button", {
        name: "Aumentar Cantidad de Tornillo, 1/4 in",
      }),
    ).toBeEnabled()
  })

  it("does not refire the batch when a stepper is pressed after resolution", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          variants: [
            { documentId: "variant-1", diameter: "1/4 in", pricing: { price: 10 } },
          ],
          products: [{ documentId: "prod-1", name: "Tornillo" }],
        },
      }),
    )
    seedCart([variantLine()])
    const user = userEvent.setup()

    render(<QuotePage />)
    await screen.findByText("Tornillo")
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    await user.click(
      screen.getByRole("button", {
        name: "Aumentar Cantidad de Tornillo, 1/4 in",
      }),
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("/api/catalog/revalidate")
  })

  it("shows the failure banner, keeps snapshot prices and controls working, and Reintentar refires", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"))
    seedCart([variantLine()])
    const user = userEvent.setup()

    render(<QuotePage />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("No pudimos comprobar los precios.")
    expect(alert).toHaveTextContent(
      "Mostramos los precios guardados. Te los confirmaremos al responder tu solicitud; puedes continuar.",
    )
    expect(screen.getAllByText("$10.00 MXN").length).toBeGreaterThan(0)

    await user.click(
      screen.getByRole("button", {
        name: "Aumentar Cantidad de Tornillo, 1/4 in",
      }),
    )
    expect(screen.getAllByText("$20.00 MXN").length).toBeGreaterThan(0)

    await user.click(
      screen.getByRole("button", { name: "Quitar Tornillo, 1/4 in" }),
    )
    expect(await screen.findByText("Tu lista está vacía")).toBeInTheDocument()
  })

  it("Reintentar calls fetch a second time and the alert clears on success", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"))
    seedCart([variantLine()])
    const user = userEvent.setup()

    render(<QuotePage />)
    await screen.findByRole("alert")
    expect(fetchMock).toHaveBeenCalledTimes(1)

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          variants: [
            { documentId: "variant-1", diameter: "1/4 in", pricing: { price: 10 } },
          ],
          products: [{ documentId: "prod-1", name: "Tornillo" }],
        },
      }),
    )
    await user.click(screen.getByRole("button", { name: "Reintentar" }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    )
  })

  it("issues no request when the cart is empty", async () => {
    render(<QuotePage />)
    await screen.findByText("Tu lista está vacía")

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("dedupes product ids shared across two lines of the same product", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: { variants: [], products: [] },
      }),
    )
    seedCart([
      variantLine({
        productDocumentId: "prod-1",
        productName: "Tornillo",
        variantDocumentId: "variant-1",
        diameter: "1/4 in",
      }),
      variantLine({
        productDocumentId: "prod-1",
        productName: "Tornillo",
        variantDocumentId: "variant-2",
        diameter: "1/2 in",
      }),
    ])

    render(<QuotePage />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [url] = fetchMock.mock.calls[0]
    const params = new URL(String(url), "http://localhost").searchParams
    expect(params.get("variantIds")).toBe("variant-1,variant-2")
    expect(params.get("productIds")).toBe("prod-1")
  })
})

describe("QuoteLineRow five states", () => {
  it("renders the changed-price state with the struck previous price and TOTAL ACTUAL", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          variants: [
            { documentId: "variant-1", diameter: "1/4 in", pricing: { price: 15 } },
          ],
          products: [{ documentId: "prod-1", name: "Tornillo" }],
        },
      }),
    )
    seedCart([variantLine({ unitPrice: 10, quantity: 2 })])

    render(<QuotePage />)
    await screen.findByText("El precio cambió al comprobar la lista.")

    expect(screen.getByText("Precio anterior:")).toBeInTheDocument()
    expect(screen.getByText("$10.00 MXN")).toBeInTheDocument()
    expect(screen.getByText("$15.00 MXN")).toBeInTheDocument()
    expect(screen.getByText("Total actual")).toBeInTheDocument()
    expect(screen.getAllByText("$30.00 MXN").length).toBeGreaterThan(0)
  })

  it("does not flag a change for a cents-equal price (648.9 vs 648.90)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          variants: [
            { documentId: "variant-1", diameter: "1/4 in", pricing: { price: 648.9 } },
          ],
          products: [{ documentId: "prod-1", name: "Tornillo" }],
        },
      }),
    )
    seedCart([variantLine({ unitPrice: 648.9, quantity: 1 })])

    render(<QuotePage />)
    await screen.findByText("Tornillo")
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    expect(
      screen.queryByText("El precio cambió al comprobar la lista."),
    ).not.toBeInTheDocument()
  })

  it("renders the variant-gone state, excludes it from the subtotal, and Elegir otra medida opens the drawer", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("/api/catalog/variants")) {
        return jsonResponse({
          success: true,
          data: [
            { documentId: "variant-new", diameter: "3/8 in", pricing: { price: 20 } },
          ],
        })
      }
      return jsonResponse({
        success: true,
        data: {
          variants: [],
          products: [{ documentId: "prod-1", name: "Tornillo" }],
        },
      })
    })
    const user = userEvent.setup()
    seedCart([variantLine()])

    render(<QuotePage />)
    const button = await screen.findByRole("button", {
      name: "Elegir otra medida de Tornillo, 1/4 in",
    })

    expect(
      screen.getByText("La medida 1/4 in ya no está disponible."),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Esta línea no se incluye en el subtotal."),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Aumentar/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("$0.00 MXN")).toBeInTheDocument()

    await user.click(button)
    expect(
      await screen.findByRole("checkbox", { name: /3\/8 in/ }),
    ).toBeInTheDocument()
  })

  it("renders the product-gone state with a Buscar alternativa link, taking precedence over a variant-less line", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: { variants: [], products: [] },
      }),
    )
    seedCart([
      {
        productDocumentId: "prod-2",
        productName: '1/2" Punta Bristol Cromado',
        quantity: 1,
        variantDocumentId: null,
        unitPrice: null,
      },
    ])

    render(<QuotePage />)
    const link = await screen.findByRole("link", {
      name: 'Buscar alternativa para 1/2" Punta Bristol Cromado',
    })

    expect(
      screen.getByText("Este producto ya no está disponible."),
    ).toBeInTheDocument()
    expect(screen.queryByText("Sin medida seleccionada")).not.toBeInTheDocument()
    expect(link).toHaveAttribute(
      "href",
      '/?mode=name&q=1%2F2%22%20Punta%20Bristol%20Cromado&page=1',
    )
  })

  it("renders no Buscar alternativa link when the name strips to nothing", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: { variants: [], products: [] },
      }),
    )
    seedCart([
      {
        productDocumentId: "prod-3",
        productName: "***",
        quantity: 1,
        variantDocumentId: null,
        unitPrice: null,
      },
    ])

    render(<QuotePage />)
    await screen.findByText("Este producto ya no está disponible.")

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("renders the no-price state with the stepper kept and only Quitar offered", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          variants: [{ documentId: "variant-1", diameter: "1/4 in", pricing: null }],
          products: [{ documentId: "prod-1", name: "Tornillo" }],
        },
      }),
    )
    seedCart([variantLine()])

    render(<QuotePage />)
    await screen.findByText("Esta medida no tiene precio actual.")

    expect(
      screen.getByText(
        "Te confirmaremos el precio al responder tu solicitud. Si no está disponible, buscaremos una alternativa.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Aumentar Cantidad de Tornillo, 1/4 in",
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Elegir otra medida/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /Buscar alternativa/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("$0.00 MXN")).toBeInTheDocument()
  })

  it("reads $0.00 in the subtotal label when every line is gone or unpriced", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: { variants: [], products: [] },
      }),
    )
    seedCart([variantLine({ unitPrice: 999, quantity: 5 })])

    render(<QuotePage />)
    await screen.findByText("Este producto ya no está disponible.")

    const subtotalLabel = screen.getByText(
      "Subtotal estimado (líneas con precio)",
    )
    const subtotalBlock = subtotalLabel.closest("div")?.parentElement
    expect(subtotalBlock).toHaveTextContent("$0.00 MXN")
  })

  it("shows the three price-affix values across guardado, comprobado, and sin confirmar", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          variants: [
            { documentId: "variant-1", diameter: "1/4 in", pricing: { price: 10 } },
          ],
          products: [{ documentId: "prod-1", name: "Tornillo" }],
        },
      }),
    )
    seedCart([variantLine()])

    const { unmount } = render(<QuotePage />)
    await screen.findByText("1/4 in · precio comprobado")
    unmount()

    localStorage.clear()
    seedCart([variantLine()])
    fetchMock.mockRejectedValueOnce(new Error("down"))
    render(<QuotePage />)
    await screen.findByText("1/4 in · precio sin confirmar")
  })

  it("moves focus to the list region only when the focused stepper's line disappears", async () => {
    let resolveFetch: (value: Response) => void = () => {}
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    seedCart([variantLine()])
    const user = userEvent.setup()

    render(<QuotePage />)
    const stepper = await screen.findByRole("button", {
      name: "Aumentar Cantidad de Tornillo, 1/4 in",
    })
    await user.click(stepper)
    stepper.focus()
    expect(document.activeElement).toBe(stepper)

    resolveFetch(
      jsonResponse({
        success: true,
        data: { variants: [], products: [] },
      }),
    )

    await waitFor(() =>
      expect(
        screen.getByText("Este producto ya no está disponible."),
      ).toBeInTheDocument(),
    )
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute("tabindex", "-1")
    })
  })
})
