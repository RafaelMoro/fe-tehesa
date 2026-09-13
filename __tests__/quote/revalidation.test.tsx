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
