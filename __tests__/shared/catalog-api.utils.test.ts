/**
 * @jest-environment node
 */
import {
  CatalogApiError,
  catalogErrorToSpanish,
  fetchCatalog,
  type CatalogEnvelope,
} from "@/shared/utils/catalog-api.utils"

const originalFetch = globalThis.fetch

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  })

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("fetchCatalog", () => {
  it("forwards the path and the optional RequestInit to fetch", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({ success: true, data: ["a"] } satisfies CatalogEnvelope<string[]>),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await fetchCatalog<string[]>("/api/catalog/products", { method: "POST" })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [path, init] = fetchMock.mock.calls[0]
    expect(path).toBe("/api/catalog/products")
    expect(init).toEqual({ method: "POST" })
  })

  it("returns only the data field of a successful envelope", async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, data: [{ id: 1 }] }),
      ) as unknown as typeof fetch

    const result = await fetchCatalog<{ id: number }[]>("/api/catalog/products")
    expect(result).toEqual([{ id: 1 }])
  })

  it("throws CatalogApiError with the original code and message on failure", async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({
          success: false,
          code: "CAT_VAL_001",
          message: "Invalid page parameter",
        }),
      ) as unknown as typeof fetch

    try {
      await fetchCatalog("/api/catalog/products")
      throw new Error("expected fetchCatalog to reject")
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogApiError)
      const apiError = error as CatalogApiError
      expect(apiError.code).toBe("CAT_VAL_001")
      expect(apiError.message).toBe("Invalid page parameter")
    }
  })
})

describe("catalogErrorToSpanish", () => {
  it("returns the Spanish copy for a known catalog code", () => {
    expect(catalogErrorToSpanish("CAT_VAL_001")).toBe("Página inválida.")
  })

  it("returns the generic Spanish fallback for an unknown code", () => {
    expect(catalogErrorToSpanish("CAT_UNKNOWN_999")).toBe(
      "No se pudo completar la operación. Inténtalo de nuevo.",
    )
  })
})
