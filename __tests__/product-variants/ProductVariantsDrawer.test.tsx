import { Button, useOverlayState } from "@heroui/react"
import { render, screen, userEvent } from "@__tests__/test-utils"
import { ProductVariantsDrawer } from "@/features/ProductVariantsDrawer/ProductVariantsDrawer"
import type { Product } from "@/shared/types/global.types"
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

const DrawerHarness = ({ product }: { product: Product }) => {
  const state = useOverlayState()

  return (
    <>
      <Button onPress={state.open}>Abrir detalles</Button>
      <ProductVariantsDrawer product={product} state={state} />
    </>
  )
}

const originalFetch = globalThis.fetch
const originalConsoleError = console.error

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

afterEach(() => {
  globalThis.fetch = originalFetch
  console.error = originalConsoleError
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
          { diameter: "Grande", pricing: { price: 30 } },
          { diameter: "Pequeña", pricing: { price: 10 } },
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
  })

  it("updates the selected count and total", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: [{ diameter: "Pequeña", pricing: { price: 10 } }],
      }),
    )

    render(<DrawerHarness product={product} />)
    await user.click(screen.getByRole("button", { name: "Abrir detalles" }))

    const checkbox = await screen.findByRole("checkbox", { name: /Pequeña/ })
    await user.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(screen.getByText("1 variante · 1 pieza")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Agregar 1 al carrito" })).toBeEnabled()

    const quantity = screen.getByRole("spinbutton", {
      name: "Cantidad de Pequeña",
    })
    await user.clear(quantity)
    await user.type(quantity, "3")

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
          data: [{ diameter: "Primera", pricing: { price: 20 } }],
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
        data: [{ diameter: "Actual", pricing: { price: 15 } }],
      }),
    )
    expect(await screen.findByText("Actual")).toBeInTheDocument()

    firstRequest.resolve(
      jsonResponse({
        success: true,
        data: [{ diameter: "Vieja", pricing: { price: 5 } }],
      }),
    )
    expect(screen.queryByText("Vieja")).not.toBeInTheDocument()
  })
})
