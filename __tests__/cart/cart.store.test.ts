import { cartLineKey, createCartStore } from "@/zustand/store/cart.store"
import { CART_MAX_LINES, CART_MAX_QUANTITY } from "@/shared/constants/cart.constants"
import type { CartProductLine, CartVariantLine } from "@/shared/types/global.types"

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

const buildProductLine = (
  overrides: Partial<CartProductLine> = {},
): CartProductLine => ({
  productDocumentId: "prod-1",
  productName: "Tornillo",
  quantity: 1,
  variantDocumentId: null,
  unitPrice: null,
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

  describe("setLineQuantity", () => {
    it("clamps a quantity above CART_MAX_QUANTITY", () => {
      const store = createCartStore()
      store.getState().addVariantLines([buildVariantLine({ quantity: 1 })])
      const key = cartLineKey(store.getState().lines[0])

      store.getState().setLineQuantity(key, 500)

      expect(store.getState().lines[0].quantity).toBe(CART_MAX_QUANTITY)
    })

    it("clamps a quantity below CART_MIN_QUANTITY", () => {
      const store = createCartStore()
      store.getState().addVariantLines([buildVariantLine({ quantity: 5 })])
      const key = cartLineKey(store.getState().lines[0])

      store.getState().setLineQuantity(key, 0)

      expect(store.getState().lines[0].quantity).toBe(1)
    })

    it("truncates a fractional quantity", () => {
      const store = createCartStore()
      store.getState().addVariantLines([buildVariantLine({ quantity: 5 })])
      const key = cartLineKey(store.getState().lines[0])

      store.getState().setLineQuantity(key, 3.9)

      expect(store.getState().lines[0].quantity).toBe(3)
    })

    it("ignores a NaN quantity", () => {
      const store = createCartStore()
      store.getState().addVariantLines([buildVariantLine({ quantity: 5 })])
      const key = cartLineKey(store.getState().lines[0])

      store.getState().setLineQuantity(key, NaN)

      expect(store.getState().lines[0].quantity).toBe(5)
    })

    it("leaves other lines alone", () => {
      const store = createCartStore()
      store.getState().addVariantLines([
        buildVariantLine({ variantDocumentId: "variant-1", quantity: 1 }),
        buildVariantLine({ variantDocumentId: "variant-2", quantity: 1 }),
      ])
      const key = cartLineKey(store.getState().lines[0])

      store.getState().setLineQuantity(key, 7)

      expect(store.getState().lines[0].quantity).toBe(7)
      expect(store.getState().lines[1].quantity).toBe(1)
    })

    it("is a no-op on an unknown key", () => {
      const store = createCartStore()
      store.getState().addVariantLines([buildVariantLine({ quantity: 1 })])

      store.getState().setLineQuantity("prod-1:missing", 7)

      expect(store.getState().lines[0].quantity).toBe(1)
    })
  })

  describe("removeLine", () => {
    it("removes only the matching line", () => {
      const store = createCartStore()
      store.getState().addVariantLines([
        buildVariantLine({ variantDocumentId: "variant-1" }),
        buildVariantLine({ variantDocumentId: "variant-2" }),
      ])
      const keyToRemove = cartLineKey(store.getState().lines[0])

      store.getState().removeLine(keyToRemove)

      expect(store.getState().lines).toHaveLength(1)
      expect(store.getState().lines[0].variantDocumentId).toBe("variant-2")
    })

    it("is a no-op on an unknown key", () => {
      const store = createCartStore()
      store.getState().addVariantLines([buildVariantLine()])

      store.getState().removeLine("prod-1:missing")

      expect(store.getState().lines).toHaveLength(1)
    })

    it("empties the cart when removing the last line", () => {
      const store = createCartStore()
      store.getState().addVariantLines([buildVariantLine()])
      const key = cartLineKey(store.getState().lines[0])

      store.getState().removeLine(key)

      expect(store.getState().lines).toEqual([])
    })
  })

  describe("upgradeLine", () => {
    it("replaces the line in place, preserving position", () => {
      const store = createCartStore()
      store.getState().addVariantLines([
        buildVariantLine({ variantDocumentId: "variant-1" }),
      ])
      store.getState().addProductLine(
        buildProductLine({ productDocumentId: "prod-2" }),
      )
      store.getState().addVariantLines([
        buildVariantLine({ productDocumentId: "prod-3", variantDocumentId: "variant-3" }),
      ])
      const middleKey = cartLineKey(store.getState().lines[1])
      const upgraded = buildVariantLine({
        productDocumentId: "prod-2",
        variantDocumentId: "variant-2",
        diameter: "1/2 in",
        quantity: 4,
      })

      const result = store.getState().upgradeLine(middleKey, upgraded)

      expect(result).toBe("upgraded")
      expect(store.getState().lines).toHaveLength(3)
      expect(store.getState().lines[1]).toEqual(upgraded)
    })

    it("carries the quantity across the upgrade", () => {
      const store = createCartStore()
      store.getState().addProductLine(
        buildProductLine({ quantity: 6 }),
      )
      const key = cartLineKey(store.getState().lines[0])
      const upgraded = buildVariantLine({ quantity: 6 })

      store.getState().upgradeLine(key, upgraded)

      expect(store.getState().lines[0].quantity).toBe(6)
    })

    it("returns missing for an unknown key and sets nothing", () => {
      const store = createCartStore()
      store.getState().addProductLine(buildProductLine())

      const result = store
        .getState()
        .upgradeLine("prod-1:missing", buildVariantLine())

      expect(result).toBe("missing")
      expect(store.getState().lines).toHaveLength(1)
      expect(store.getState().lines[0].variantDocumentId).toBeNull()
    })

    it("merges into a colliding priced line, keeps its position, and clamps at CART_MAX_QUANTITY", () => {
      const store = createCartStore()
      store.getState().addVariantLines([
        buildVariantLine({ variantDocumentId: "variant-1", quantity: 90 }),
      ])
      store.getState().addProductLine(buildProductLine({ quantity: 20 }))
      const variantLessKey = cartLineKey(store.getState().lines[1])
      const upgraded = buildVariantLine({
        variantDocumentId: "variant-1",
        quantity: 20,
      })

      const result = store.getState().upgradeLine(variantLessKey, upgraded)

      expect(result).toBe("merged")
      expect(store.getState().lines).toHaveLength(1)
      expect(store.getState().lines[0].variantDocumentId).toBe("variant-1")
      expect(store.getState().lines[0].quantity).toBe(CART_MAX_QUANTITY)
    })
  })
})
