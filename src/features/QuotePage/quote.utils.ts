import type { CartLine } from "@/shared/types/global.types"

export type QuoteTotals = {
  subtotal: number
  productCount: number
  pieceCount: number
}

export const getQuoteTotals = (lines: CartLine[]): QuoteTotals => {
  let cents = 0
  let pieceCount = 0

  for (const line of lines) {
    pieceCount += line.quantity
    if (line.unitPrice !== null) {
      cents += Math.round(line.unitPrice * 100) * line.quantity
    }
  }

  return {
    subtotal: cents / 100,
    productCount: lines.length,
    pieceCount,
  }
}
