import type { CartLine } from "@/shared/types/global.types"
import {
  SEARCH_TERM_MAX_LENGTH,
  SEARCH_TERM_UNSAFE_PATTERN,
} from "@/shared/constants/catalog.constants"

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

export const buildProductSearchHref = (productName: string): string | null => {
  const segments = productName
    .split(SEARCH_TERM_UNSAFE_PATTERN)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

  if (segments.length === 0) {
    return null
  }

  const longest = segments.reduce((longestSoFar, segment) =>
    segment.length > longestSoFar.length ? segment : longestSoFar,
  )
  const truncated = longest.slice(0, SEARCH_TERM_MAX_LENGTH)

  return `/?mode=name&q=${encodeURIComponent(truncated)}&page=1`
}
