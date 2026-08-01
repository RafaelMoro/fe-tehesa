import { getQuoteTotals } from "@/features/QuotePage/quote.utils"
import type { CartLine } from "@/shared/types/global.types"

const pricedLine = (overrides: Partial<CartLine> = {}): CartLine =>
  ({
    productDocumentId: "prod-1",
    productName: "Tornillo",
    quantity: 1,
    variantDocumentId: "variant-1",
    diameter: "1/4 in",
    unitPrice: 10,
    ...overrides,
  }) as CartLine

const variantLessLine = (overrides: Partial<CartLine> = {}): CartLine =>
  ({
    productDocumentId: "prod-2",
    productName: "Tuerca",
    quantity: 2,
    variantDocumentId: null,
    unitPrice: null,
    ...overrides,
  }) as CartLine

describe("getQuoteTotals", () => {
  it("returns zeros for an empty cart", () => {
    expect(getQuoteTotals([])).toEqual({
      subtotal: 0,
      productCount: 0,
      pieceCount: 0,
    })
  })

  it("excludes variant-less lines from the subtotal but counts them", () => {
    const totals = getQuoteTotals([
      pricedLine({ unitPrice: 10, quantity: 2 }),
      variantLessLine({ quantity: 3 }),
    ])

    expect(totals).toEqual({
      subtotal: 20,
      productCount: 2,
      pieceCount: 5,
    })
  })

  it("accumulates in integer cents to avoid float drift across many 0.1-class prices", () => {
    const lines = Array.from({ length: 25 }, (_, index) =>
      pricedLine({
        variantDocumentId: `variant-${index}`,
        unitPrice: 0.1,
        quantity: 1,
      }),
    )

    const floatBaseline = lines.reduce(
      (total, line) => total + (line.unitPrice as number) * line.quantity,
      0,
    )
    const totals = getQuoteTotals(lines)

    expect(totals.subtotal).toBeCloseTo(2.5, 10)
    expect(totals.subtotal).not.toBe(floatBaseline)
  })

  it("counts pieces across both priced and variant-less lines", () => {
    const totals = getQuoteTotals([
      pricedLine({ quantity: 4 }),
      variantLessLine({ quantity: 6 }),
    ])

    expect(totals.pieceCount).toBe(10)
    expect(totals.productCount).toBe(2)
  })
})
