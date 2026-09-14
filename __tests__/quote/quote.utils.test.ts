import {
  buildProductSearchHref,
  getEffectiveLines,
  getQuoteTotals,
  type LineChecks,
} from "@/features/QuotePage/quote.utils"
import type { CartLine } from "@/shared/types/global.types"
import { cartLineKey } from "@/zustand/store/cart.store"

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

  it("one-arg call is unchanged when checks is omitted", () => {
    const lines = [pricedLine(), variantLessLine()]
    expect(getQuoteTotals(lines, undefined)).toEqual(getQuoteTotals(lines))
  })

  it("uses the current price over the snapshot for a priced check", () => {
    const line = pricedLine({ unitPrice: 10, quantity: 2 })
    const checks: LineChecks = {
      [cartLineKey(line)]: { kind: "priced", currentPrice: 15 },
    }
    const totals = getQuoteTotals([line], checks)
    expect(totals.subtotal).toBe(30)
  })

  it("excludes a variant-gone line from the subtotal but keeps it in the counts", () => {
    const line = pricedLine({ quantity: 3 })
    const checks: LineChecks = {
      [cartLineKey(line)]: { kind: "variant-gone" },
    }
    const totals = getQuoteTotals([line], checks)
    expect(totals.subtotal).toBe(0)
    expect(totals.productCount).toBe(1)
    expect(totals.pieceCount).toBe(3)
  })

  it("excludes a product-gone line from the subtotal but keeps it in the counts", () => {
    const line = pricedLine({ quantity: 3 })
    const checks: LineChecks = {
      [cartLineKey(line)]: { kind: "product-gone" },
    }
    const totals = getQuoteTotals([line], checks)
    expect(totals.subtotal).toBe(0)
    expect(totals.productCount).toBe(1)
    expect(totals.pieceCount).toBe(3)
  })

  it("excludes a no-price line from the subtotal but keeps it in the counts", () => {
    const line = pricedLine({ quantity: 4 })
    const checks: LineChecks = {
      [cartLineKey(line)]: { kind: "no-price" },
    }
    const totals = getQuoteTotals([line], checks)
    expect(totals.subtotal).toBe(0)
    expect(totals.productCount).toBe(1)
    expect(totals.pieceCount).toBe(4)
  })

  it("falls back to the snapshot price for a line with no check entry", () => {
    const checked = pricedLine({
      productDocumentId: "prod-1",
      unitPrice: 10,
      quantity: 1,
    })
    const unchecked = pricedLine({
      productDocumentId: "prod-3",
      variantDocumentId: "variant-3",
      unitPrice: 7,
      quantity: 1,
    })
    const checks: LineChecks = {
      [cartLineKey(checked)]: { kind: "priced", currentPrice: 10 },
    }
    const totals = getQuoteTotals([checked, unchecked], checks)
    expect(totals.subtotal).toBe(17)
  })

  it("compares prices in integer cents, not floats", () => {
    const line = pricedLine({ unitPrice: 648.9, quantity: 1 })
    const checks: LineChecks = {
      [cartLineKey(line)]: { kind: "priced", currentPrice: 648.9 },
    }
    const totals = getQuoteTotals([line], checks)
    expect(totals.subtotal).toBeCloseTo(648.9, 10)
  })
})

describe("getEffectiveLines", () => {
  it("swaps in the checks' current price for a priced check", () => {
    const line = pricedLine({ unitPrice: 10 })
    const checks: LineChecks = {
      [cartLineKey(line)]: { kind: "priced", currentPrice: 15 },
    }

    const [effective] = getEffectiveLines([line], checks)

    expect(effective.unitPrice).toBe(15)
  })

  it("excludes a variant-gone line", () => {
    const line = pricedLine()
    const checks: LineChecks = {
      [cartLineKey(line)]: { kind: "variant-gone" },
    }

    expect(getEffectiveLines([line], checks)).toEqual([])
  })

  it("excludes a product-gone line", () => {
    const line = pricedLine()
    const checks: LineChecks = {
      [cartLineKey(line)]: { kind: "product-gone" },
    }

    expect(getEffectiveLines([line], checks)).toEqual([])
  })

  it("leaves an unchecked line's stored price untouched", () => {
    const line = pricedLine({ unitPrice: 7 })

    const [effective] = getEffectiveLines([line], {})

    expect(effective).toEqual(line)
  })

  it("leaves a no-price checked line unchanged", () => {
    const line = pricedLine({ unitPrice: 7 })
    const checks: LineChecks = {
      [cartLineKey(line)]: { kind: "no-price" },
    }

    const [effective] = getEffectiveLines([line], checks)

    expect(effective).toEqual(line)
  })

  it("works with no checks argument at all", () => {
    const line = pricedLine()
    expect(getEffectiveLines([line])).toEqual([line])
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
