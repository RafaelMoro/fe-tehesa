/**
 * @jest-environment jsdom
 */
import { useEffect } from "react"
import { render, act } from "@__tests__/test-utils"
import { useCatalogSearch } from "@/features/Home/useCatalogSearch"
import type { Product } from "@/shared/types/global.types"

const products: Product[] = [
  {
    name: "Tire A",
    documentId: "doc-1",
    category: { name: "Tubes" },
    brand: { name: "Acme" },
  },
]

const Harness = ({
  products: harnessProducts,
  onReady,
}: {
  products: Product[]
  onReady: (api: ReturnType<typeof useCatalogSearch>) => void
}) => {
  const api = useCatalogSearch({ products: harnessProducts })
  useEffect(() => {
    onReady(api)
  })
  return (
    <div>
      <span data-testid="mode">{api.activeCatalogMode ?? "null"}</span>
      <span data-testid="term">{api.catalogSearchTerm}</span>
      <span data-testid="message">{api.catalogMessage ?? ""}</span>
      <span data-testid="kind">{api.catalogMessageKind ?? "null"}</span>
      <span data-testid="invalid">{String(api.isInvalidCatalogSearch)}</span>
      <span data-testid="invalid-msg">{api.invalidSearchMessage ?? ""}</span>
      <span data-testid="loading">{String(api.isLoadingCatalogSearch)}</span>
      <span data-testid="drawer-open">
        {String(api.catalogSearchDrawerState.isOpen)}
      </span>
    </div>
  )
}

let harnessApi: ReturnType<typeof useCatalogSearch> | null = null
const captureApi = (api: ReturnType<typeof useCatalogSearch>) => {
  harnessApi = api
}

const originalFetch = globalThis.fetch

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => "application/json" },
  json: async () => body,
})

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  harnessApi = null
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

const mount = (initialProducts: Product[] = products) => {
  render(<Harness products={initialProducts} onReady={captureApi} />)
  return getApi()
}

const getApi = () => harnessApi!

describe("useCatalogSearch", () => {
  it("sets the specific invalid message on whitespace-only submit and does not request", async () => {
    const fetchMock = jest.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("   ")
    })

    await act(async () => {
      await getApi().handleCatalogNameSearch(1)
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(getApi().isInvalidCatalogSearch).toBe(true)
    expect(getApi().invalidSearchMessage).toBe(
      "Ingresa un texto para buscar en el catálogo.",
    )
  })

  it("clears invalid state when the term is edited", async () => {
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("   ")
    })

    await act(async () => {
      await getApi().handleCatalogNameSearch(1)
    })
    expect(getApi().isInvalidCatalogSearch).toBe(true)

    act(() => {
      getApi().handleCatalogSearchTermChange("a")
    })
    expect(getApi().isInvalidCatalogSearch).toBe(false)
  })

  it("shows the loading message during a deferred request and returns the products on success", async () => {
    const deferredFetch = deferred<{ ok: boolean; status: number; headers: { get: () => string }; json: () => Promise<unknown> }>()
    const fetchMock = jest.fn(() => Promise.resolve(deferredFetch.promise))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("Tire")
    })

    let searchPromise: Promise<Product[] | null> = Promise.resolve(null)
    act(() => {
      searchPromise = getApi().handleCatalogNameSearch(1)
    })

    expect(getApi().isLoadingCatalogSearch).toBe(true)
    expect(getApi().catalogMessage).toBe("Buscando productos en el catálogo...")
    expect(getApi().catalogMessageKind).toBe("status")

    await act(async () => {
      deferredFetch.resolve(
        jsonResponse({ success: true, data: [products[0]] }),
      )
      await searchPromise
    })

    expect(getApi().isLoadingCatalogSearch).toBe(false)
    expect(getApi().activeCatalogMode).toBe("name")
    expect(getApi().catalogSearchDrawerState.isOpen).toBe(false)
  })

  it("sets the empty success message when results are empty", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({ success: true, data: [] }),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("nothing")
    })

    await act(async () => {
      await getApi().handleCatalogNameSearch(1)
    })

    expect(getApi().catalogMessage).toBe("No encontramos productos en el catálogo.")
    expect(getApi().catalogMessageKind).toBe("status")
  })

  it("maps CAT_VAL_006 to invalid field state with the specific message", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({
        success: false,
        code: "CAT_VAL_006",
        message: "Invalid search term: empty",
      }),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("Tire")
    })

    await act(async () => {
      await getApi().handleCatalogNameSearch(1)
    })

    expect(getApi().isInvalidCatalogSearch).toBe(true)
    expect(getApi().invalidSearchMessage).toBe(
      "Revisa el texto de búsqueda e inténtalo de nuevo.",
    )
  })

  it("maps other known codes through the Spanish helper", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({
        success: false,
        code: "CAT_ERR_001",
        message: "Upstream catalog error",
      }),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("Tire")
    })

    await act(async () => {
      await getApi().handleCatalogNameSearch(1)
    })

    expect(getApi().catalogMessage).toBe(
      "No se pudo cargar el catálogo. Inténtalo de nuevo.",
    )
    expect(getApi().catalogMessageKind).toBe("error")
  })

  it("uses the generic message for untyped errors", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("network"))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const api = mount()

    act(() => {
      api.handleCatalogSearchTermChange("Tire")
    })

    await act(async () => {
      await getApi().handleCatalogNameSearch(1)
    })

    expect(getApi().catalogMessage).toBe(
      "No pudimos buscar productos. Inténtalo de nuevo.",
    )
    expect(getApi().catalogMessageKind).toBe("error")
  })

  it("beginCatalogMode clears name state and closes the drawer", () => {
    const api = mount()

    act(() => {
      api.catalogSearchDrawerState.open()
    })
    expect(getApi().catalogSearchDrawerState.isOpen).toBe(true)

    act(() => {
      getApi().handleCatalogSearchTermChange("Tire")
    })

    act(() => {
      getApi().beginCatalogMode("category")
    })

    expect(getApi().activeCatalogMode).toBe("category")
    expect(getApi().catalogSearchTerm).toBe("")
    expect(getApi().catalogSearchDrawerState.isOpen).toBe(false)
  })

  it("clearAllCatalogState resets everything", () => {
    const api = mount()
    act(() => {
      api.beginCatalogMode("brand")
    })
    expect(getApi().activeCatalogMode).toBe("brand")

    act(() => {
      getApi().clearAllCatalogState()
    })
    expect(getApi().activeCatalogMode).toBe(null)
    expect(getApi().catalogSearchTerm).toBe("")
  })

  it("resets state when the products prop changes", () => {
    const { rerender } = render(
      <Harness products={products} onReady={captureApi} />,
    )
    act(() => {
      harnessApi!.beginCatalogMode("category")
    })
    expect(harnessApi!.activeCatalogMode).toBe("category")

    const newProducts: Product[] = [
      {
        name: "New",
        documentId: "new-1",
        category: { name: "Tubes" },
        brand: { name: "Acme" },
      },
    ]
    rerender(<Harness products={newProducts} onReady={captureApi} />)

    expect(harnessApi!.activeCatalogMode).toBe(null)
    expect(harnessApi!.catalogSearchTerm).toBe("")
  })
})
