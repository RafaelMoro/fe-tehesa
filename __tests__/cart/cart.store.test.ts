import { createCartStore } from "@/zustand/store/cart.store"
import { CART_MAX_LINES, CART_MAX_QUANTITY } from "@/shared/constants/cart.constants"
import type { CartVariantLine } from "@/shared/types/global.types"

const buildVariantLine = (
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

describe("cart.store", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("appends a new variant line", () => {
    const store = createCartStore()

    const result = store.getState().addVariantLines([buildVariantLine()])

    expect(result).toEqual({ added: 1, incremented: 0, rejected: false })
    expect(store.getState().lines).toHaveLength(1)
  })

  it("increments an existing line keyed by documentId", () => {
    const store = createCartStore()
    store.getState().addVariantLines([buildVariantLine({ quantity: 2 })])

    const result = store
      .getState()
      .addVariantLines([buildVariantLine({ quantity: 3 })])

    expect(result).toEqual({ added: 0, incremented: 1, rejected: false })
    expect(store.getState().lines).toEqual([
      expect.objectContaining({ quantity: 5 }),
    ])
  })

  it("handles a batch mixing new and existing keys", () => {
    const store = createCartStore()
    store.getState().addVariantLines([buildVariantLine({ variantDocumentId: "variant-1" })])

    const result = store.getState().addVariantLines([
      buildVariantLine({ variantDocumentId: "variant-1" }),
      buildVariantLine({ variantDocumentId: "variant-2" }),
    ])

    expect(result).toEqual({ added: 1, incremented: 1, rejected: false })
    expect(store.getState().lines).toHaveLength(2)
  })

  it("clamps incremented quantity at CART_MAX_QUANTITY", () => {
    const store = createCartStore()
    store.getState().addVariantLines([buildVariantLine({ quantity: 99 })])

    store.getState().addVariantLines([buildVariantLine({ quantity: 50 })])

    expect(store.getState().lines[0].quantity).toBe(CART_MAX_QUANTITY)
  })

  it("refuses a batch that would exceed CART_MAX_LINES and leaves state untouched", () => {
    const store = createCartStore()
    const initialLines = Array.from({ length: CART_MAX_LINES }, (_, index) =>
      buildVariantLine({ variantDocumentId: `variant-${index}` }),
    )
    store.getState().addVariantLines(initialLines)

    const result = store
      .getState()
      .addVariantLines([buildVariantLine({ variantDocumentId: "variant-overflow" })])

    expect(result).toEqual({ added: 0, incremented: 0, rejected: true })
    expect(store.getState().lines).toHaveLength(CART_MAX_LINES)
  })

  it("clearLines leaves contact untouched", () => {
    const store = createCartStore()
    store.getState().addVariantLines([buildVariantLine()])
    store.getState().setContact({
      firstName: "Ana",
      lastName: "Pérez",
      email: "ana@example.com",
    })

    store.getState().clearLines()

    expect(store.getState().lines).toEqual([])
    expect(store.getState().contact).not.toBeNull()
  })

  it("clearContact leaves lines untouched", () => {
    const store = createCartStore()
    store.getState().addVariantLines([buildVariantLine()])
    store.getState().setContact({
      firstName: "Ana",
      lastName: "Pérez",
      email: "ana@example.com",
    })

    store.getState().clearContact()

    expect(store.getState().contact).toBeNull()
    expect(store.getState().lines).toHaveLength(1)
  })
})
