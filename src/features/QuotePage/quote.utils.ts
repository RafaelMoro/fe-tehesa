import type { CartLine } from "@/shared/types/global.types"
import { cartLineKey } from "@/zustand/store/cart.store"
import {
  SEARCH_TERM_MAX_LENGTH,
  SEARCH_TERM_UNSAFE_PATTERN,
} from "@/shared/constants/catalog.constants"

export type QuoteTotals = {
  subtotal: number
  productCount: number
  pieceCount: number
}

export type LineCheck =
  | { kind: "priced"; currentPrice: number }
  | { kind: "no-price" }
  | { kind: "variant-gone" }
  | { kind: "product-gone" }

export type LineChecks = Record<string, LineCheck>

export const getQuoteTotals = (
  lines: CartLine[],
  checks?: LineChecks,
): QuoteTotals => {
  let cents = 0
  let pieceCount = 0

  for (const line of lines) {
    pieceCount += line.quantity
    const check = checks?.[cartLineKey(line)]

    if (check?.kind === "variant-gone" || check?.kind === "product-gone") {
      continue
    }
    if (check?.kind === "no-price") {
      continue
    }
    if (check?.kind === "priced") {
      cents += Math.round(check.currentPrice * 100) * line.quantity
      continue
    }
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

export const getEffectiveLines = (
  lines: CartLine[],
  checks?: LineChecks,
): CartLine[] => {
  const effectiveLines: CartLine[] = []

  for (const line of lines) {
    const check = checks?.[cartLineKey(line)]

    if (check?.kind === "variant-gone" || check?.kind === "product-gone") {
      continue
    }

    if (check?.kind === "priced" && line.variantDocumentId !== null) {
      effectiveLines.push({ ...line, unitPrice: check.currentPrice })
      continue
    }

    effectiveLines.push(line)
  }

  return effectiveLines
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
