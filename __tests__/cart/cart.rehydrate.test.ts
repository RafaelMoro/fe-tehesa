import {
  createCartStore,
  isValidCartLine,
  sanitizeCartState,
} from "@/zustand/store/cart.store"
import {
  CART_MAX_LINES,
  CART_SCHEMA_VERSION,
  CART_STORAGE_KEY,
} from "@/shared/constants/cart.constants"
import type { CartVariantLine } from "@/shared/types/global.types"

const validLine: CartVariantLine = {
  productDocumentId: "prod-1",
  productName: "Tornillo",
  quantity: 2,
  variantDocumentId: "variant-1",
  diameter: "1/4 in",
  unitPrice: 10,
}

describe("isValidCartLine", () => {
  it("accepts a well-formed variant line", () => {
    expect(isValidCartLine(validLine)).toBe(true)
  })

  it("accepts a well-formed product line", () => {
    expect(
      isValidCartLine({
        productDocumentId: "prod-1",
        productName: "Tornillo",
        quantity: 1,
        variantDocumentId: null,
        unitPrice: null,
      }),
    ).toBe(true)
  })

  it("rejects a negative quantity", () => {
    expect(isValidCartLine({ ...validLine, quantity: -1 })).toBe(false)
  })

  it("rejects a non-integer quantity", () => {
    expect(isValidCartLine({ ...validLine, quantity: 1.5 })).toBe(false)
  })

  it("rejects a non-finite unit price", () => {
    expect(isValidCartLine({ ...validLine, unitPrice: Infinity })).toBe(false)
  })

  it("rejects a documentId failing DOCUMENT_ID_PATTERN", () => {
    expect(
      isValidCartLine({ ...validLine, productDocumentId: "bad id!" }),
    ).toBe(false)
  })

  it("rejects a wrong-shape value", () => {
    expect(isValidCartLine("not-an-object")).toBe(false)
    expect(isValidCartLine(null)).toBe(false)
    expect(isValidCartLine([])).toBe(false)
  })
})

describe("sanitizeCartState", () => {
  it("drops invalid lines and keeps valid ones", () => {
    const state = sanitizeCartState({
      lines: [validLine, { ...validLine, quantity: -1 }],
      contact: null,
    })

    expect(state.lines).toEqual([validLine])
  })

  it("returns empty state for a non-object value", () => {
    expect(sanitizeCartState("truncated")).toEqual({ lines: [], contact: null })
  })

  it("returns empty lines when lines is not an array", () => {
    expect(sanitizeCartState({ lines: "not-an-array", contact: null })).toEqual(
      { lines: [], contact: null },
    )
  })

  it("caps an oversized line array at CART_MAX_LINES before filtering", () => {
    const lines = Array.from({ length: CART_MAX_LINES + 10 }, (_, index) => ({
      ...validLine,
      variantDocumentId: `variant-${index}`,
    }))

    const state = sanitizeCartState({ lines, contact: null })

    expect(state.lines).toHaveLength(CART_MAX_LINES)
  })

  it("drops a contact with a bad email and keeps lines", () => {
    const state = sanitizeCartState({
      lines: [validLine],
      contact: {
        firstName: "Ana",
        lastName: "Pérez",
        email: "not-an-email",
      },
    })

    expect(state.contact).toBeNull()
    expect(state.lines).toEqual([validLine])
  })

  it("throws nothing on undefined or arrays", () => {
    expect(() => sanitizeCartState(undefined)).not.toThrow()
    expect(() => sanitizeCartState([1, 2, 3])).not.toThrow()
  })
})

describe("cart store rehydrate from localStorage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("drops a truncated JSON blob without throwing", () => {
    localStorage.setItem(CART_STORAGE_KEY, "{not-valid-json")

    expect(() => createCartStore()).not.toThrow()
    const store = createCartStore()
    expect(store.getState().lines).toEqual([])
  })

  it("drops a valid-JSON-wrong-shape blob", () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ state: { lines: "wrong-shape" }, version: CART_SCHEMA_VERSION }),
    )

    const store = createCartStore()
    expect(store.getState().lines).toEqual([])
  })

  it("keeps only valid lines from a mixed persisted blob", () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        state: { lines: [validLine, { ...validLine, quantity: -1 }], contact: null },
        version: CART_SCHEMA_VERSION,
      }),
    )

    const store = createCartStore()
    expect(store.getState().lines).toEqual([validLine])
  })

  it("drops the whole cart on a version mismatch", () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ state: { lines: [validLine], contact: null }, version: 0 }),
    )

    const store = createCartStore()
    expect(store.getState().lines).toEqual([])
  })
})
