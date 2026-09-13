import {
  buildProductSearchHref,
  getQuoteTotals,
} from "@/features/QuotePage/quote.utils"
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

describe("buildProductSearchHref", () => {
  it("keeps a fraction-and-quote product name whole, since / and \" are now legal", () => {
    expect(buildProductSearchHref('1/2" Punta Bristol Cromado')).toBe(
      "/?mode=name&q=1%2F2%22%20Punta%20Bristol%20Cromado&page=1",
    )
  })

  it("keeps a degree-sign product name whole", () => {
    expect(buildProductSearchHref("Broca AAV 135° Split Point")).toBe(
      "/?mode=name&q=Broca%20AAV%20135%C2%B0%20Split%20Point&page=1",
    )
  })

  it("keeps a mid-string quote product name whole", () => {
    expect(
      buildProductSearchHref('Dado Cuadro 1" Llanta Trasera Capuchon'),
    ).toBe(
      "/?mode=name&q=Dado%20Cuadro%201%22%20Llanta%20Trasera%20Capuchon&page=1",
    )
  })

  it("returns null when nothing survives the strip", () => {
    expect(buildProductSearchHref("***")).toBeNull()
  })

  it("takes the longest safe segment when a name contains truly unsafe characters", () => {
    expect(buildProductSearchHref("Foo * Bar Baz")).toBe(
      "/?mode=name&q=Bar%20Baz&page=1",
    )
  })
})
