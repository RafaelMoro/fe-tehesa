import { useEffect } from "react"
import { Button, toast, useOverlayState } from "@heroui/react"
import { render, screen, userEvent } from "@__tests__/test-utils"
import { ProductVariantsDrawer } from "@/features/ProductVariantsDrawer/ProductVariantsDrawer"
import { useCartStore } from "@/zustand/provider/cart.provider"
import { CART_MAX_LINES } from "@/shared/constants/cart.constants"
import type { CartVariantLine, Product } from "@/shared/types/global.types"
import type { CatalogEnvelope } from "@/shared/utils/catalog-api.utils"

const product: Product = {
  name: "Tire A",
  documentId: "doc-1",
  category: { name: "Tubes" },
  brand: { name: "Acme" },
}

const secondProduct: Product = {
  ...product,
  name: "Chain B",
  documentId: "doc-2",
}

const DrawerHarness = ({
  product,
  prefillLines,
}: {
  product: Product
  prefillLines?: CartVariantLine[]
}) => {
  const state = useOverlayState()
  const addVariantLines = useCartStore((store) => store.addVariantLines)
  const lineCount = useCartStore((store) => store.lines.length)

  useEffect(() => {
    if (prefillLines) {
      addVariantLines(prefillLines)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Button onPress={state.open}>Abrir detalles</Button>
      <ProductVariantsDrawer product={product} state={state} />
      <span>{lineCount} líneas en el carrito</span>
    </>
  )
}

const originalFetch = globalThis.fetch
const originalConsoleError = console.error
const originalResizeObserver = globalThis.ResizeObserver

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const jsonResponse = <T,>(body: CatalogEnvelope<T>) =>
  ({
    json: async () => body,
  }) as Response

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const mockFetch = () => {
  const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>()
  globalThis.fetch = fetchMock as typeof fetch
  return fetchMock
}

beforeEach(() => {
  localStorage.clear()
  globalThis.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver
})

afterEach(() => {
  globalThis.fetch = originalFetch
  console.error = originalConsoleError
  globalThis.ResizeObserver = originalResizeObserver
  toast.clear()
})

describe("ProductVariantsDrawer", () => {
  it("does not request variants while closed", () => {
    const fetchMock = mockFetch()

    render(<DrawerHarness product={product} />)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("shows an accessible loading status while the request is pending", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    const pending = deferred<Response>()
    fetchMock.mockReturnValue(pending.promise)

    render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Cargando variantes...",
    )
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/catalog/variants?documentId=doc-1",
      undefined,
    )
  })

  it("renders a Spanish empty-result message", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [] }))

    render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))

    expect(
      await screen.findByText("No encontramos variantes para este producto."),
    ).toBeInTheDocument()
  })

  it("renders a known catalog failure as an alert", async () => {
    const user = userEvent.setup()
    console.error = jest.fn()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: false,
        code: "CAT_NF_003",
        message: "Product not found",
      }),
    )

    render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se encontró el producto.",
    )
  })

  it("renders an untyped failure as a generic alert", async () => {
    const user = userEvent.setup()
    console.error = jest.fn()
    const fetchMock = mockFetch()
    fetchMock.mockRejectedValue(new Error("network"))

    render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos cargar las variantes. Inténtalo de nuevo.",
    )
  })

  it("renders sorted selectable variants with MXN formatting", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: [
          {
            documentId: "var-002",
            internalId: "VAR-002",
            diameter: "Grande",
            pricing: { price: 30 },
          },
          {
            documentId: "var-001",
            internalId: "VAR-001",
            diameter: "Pequeña",
            pricing: { price: 10 },
          },
        ],
      }),
    )

    render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))

    expect(
      await screen.findByRole("checkbox", { name: /Pequeña/ }),
    ).toBeInTheDocument()
    expect(screen.getByText("$10.00 MXN")).toBeInTheDocument()
    expect(screen.getByText("Grande")).toBeInTheDocument()
    expect(screen.getByText("$30.00 MXN")).toBeInTheDocument()
    expect(screen.queryByText("VAR-001")).not.toBeInTheDocument()
    expect(screen.queryByText("VAR-002")).not.toBeInTheDocument()
  })

  it("updates the selected count and total", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: [{ documentId: "var-001", diameter: "Pequeña", pricing: { price: 10 } }],
      }),
    )

    render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))

    const checkbox = await screen.findByRole("checkbox", { name: /Pequeña/ })
    await user.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(screen.getByText("1 variante · 1 pieza")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Agregar 1 al carrito" })).toBeEnabled()

    const increment = screen.getByRole("button", {
      name: "Aumentar Cantidad de Pequeña",
    })
    await user.click(increment)
    await user.click(increment)

    expect(screen.getByText(/1 variante/)).toHaveTextContent(
      "1 variante · 3 piezas",
    )
    expect(screen.getByText("$30.00 MXN")).toBeInTheDocument()
  })

  it("clears old rows on close and refetches on reopen", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    const secondRequest = deferred<Response>()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: [{ documentId: "var-primera", diameter: "Primera", pricing: { price: 20 } }],
        }),
      )
      .mockReturnValueOnce(secondRequest.promise)

    render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))
    expect(await screen.findByText("Primera")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cerrar" }))
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Cargando variantes...",
    )
    expect(screen.queryByText("Primera")).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("does not render stale data from an earlier product request", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    const firstRequest = deferred<Response>()
    const secondRequest = deferred<Response>()
    fetchMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)

    const { rerender } = render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))

    rerender(<DrawerHarness product={secondProduct} />)

    secondRequest.resolve(
      jsonResponse({
        success: true,
        data: [{ documentId: "var-actual", diameter: "Actual", pricing: { price: 15 } }],
      }),
    )
    expect(await screen.findByText("Actual")).toBeInTheDocument()

    firstRequest.resolve(
      jsonResponse({
        success: true,
        data: [{ documentId: "var-vieja", diameter: "Vieja", pricing: { price: 5 } }],
      }),
    )
    expect(screen.queryByText("Vieja")).not.toBeInTheDocument()
  })

  it("adds one line per selected variant and closes the drawer", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: [{ documentId: "var-001", diameter: "Pequeña", pricing: { price: 10 } }],
      }),
    )

    render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))
    const checkbox = await screen.findByRole("checkbox", { name: /Pequeña/ })
    await user.click(checkbox)

    await user.click(
      screen.getByRole("button", { name: "Agregar 1 al carrito" }),
    )

    expect(screen.getByText("1 líneas en el carrito")).toBeInTheDocument()
    expect(screen.queryByRole("checkbox", { name: /Pequeña/ })).not.toBeInTheDocument()
  })

  it("increments an existing line instead of appending a duplicate", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: [{ documentId: "var-001", diameter: "Pequeña", pricing: { price: 10 } }],
      }),
    )
    const prefillLines: CartVariantLine[] = [
      {
        productDocumentId: "doc-1",
        productName: "Tire A",
        quantity: 2,
        variantDocumentId: "var-001",
        diameter: "Pequeña",
        unitPrice: 10,
      },
    ]

    render(<DrawerHarness product={product} prefillLines={prefillLines} />)
    expect(await screen.findByText("1 líneas en el carrito")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))
    const checkbox = await screen.findByRole("checkbox", { name: /Pequeña/ })
    await user.click(checkbox)
    await user.click(
      screen.getByRole("button", { name: "Agregar 1 al carrito" }),
    )

    expect(screen.getByText("1 líneas en el carrito")).toBeInTheDocument()
  })

  it("refuses the add at the 100-line cap, shows the limit message, and keeps the drawer open", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: [{ documentId: "var-overflow", diameter: "Pequeña", pricing: { price: 10 } }],
      }),
    )
    const prefillLines: CartVariantLine[] = Array.from(
      { length: CART_MAX_LINES },
      (_, index) => ({
        productDocumentId: "doc-1",
        productName: "Tire A",
        quantity: 1,
        variantDocumentId: `var-existing-${index}`,
        diameter: "Pequeña",
        unitPrice: 10,
      }),
    )

    render(<DrawerHarness product={product} prefillLines={prefillLines} />)
    expect(
      await screen.findByText(`${CART_MAX_LINES} líneas en el carrito`),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))
    const checkbox = await screen.findByRole("checkbox", { name: /Pequeña/ })
    await user.click(checkbox)
    await user.click(
      screen.getByRole("button", { name: "Agregar 1 al carrito" }),
    )

    expect(
      await screen.findByText(
        `Tu lista llegó al máximo de ${CART_MAX_LINES} productos.`,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("checkbox", { name: /Pequeña/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(`${CART_MAX_LINES} líneas en el carrito`),
    ).toBeInTheDocument()
  })
})
