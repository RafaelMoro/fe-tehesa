"use client"

import { useEffect, useRef, useState } from "react"

import type { CartLine, RevalidateData } from "@/shared/types/global.types"
import { fetchCatalog } from "@/shared/utils/catalog-api.utils"
import { cartLineKey } from "@/zustand/store/cart.store"
import type { LineCheck, LineChecks } from "./quote.utils"

export type QuotePageStatus = "idle" | "checking" | "done" | "failed"

const buildRevalidateUrl = (lines: CartLine[]): string => {
  const variantIds = Array.from(
    new Set(
      lines
        .map((line) => line.variantDocumentId)
        .filter((id): id is string => id !== null),
    ),
  )
  const productIds = Array.from(
    new Set(lines.map((line) => line.productDocumentId)),
  )

  const params = new URLSearchParams()
  if (variantIds.length > 0) {
    params.set("variantIds", variantIds.join(","))
  }
  if (productIds.length > 0) {
    params.set("productIds", productIds.join(","))
  }

  return `/api/catalog/revalidate?${params.toString()}`
}

const resolveChecks = (lines: CartLine[], data: RevalidateData): LineChecks => {
  const variantsById = new Map(
    data.variants.map((variant) => [variant.documentId, variant]),
  )
  const productIds = new Set(data.products.map((product) => product.documentId))

  const checks: LineChecks = {}

  for (const line of lines) {
    if (!productIds.has(line.productDocumentId)) {
      checks[cartLineKey(line)] = { kind: "product-gone" }
      continue
    }
    if (line.variantDocumentId === null) {
      continue
    }
    const variant = variantsById.get(line.variantDocumentId)
    if (!variant) {
      checks[cartLineKey(line)] = { kind: "variant-gone" }
      continue
    }
    const check: LineCheck =
      variant.pricing === null
        ? { kind: "no-price" }
        : { kind: "priced", currentPrice: variant.pricing.price }
    checks[cartLineKey(line)] = check
  }

  return checks
}

export const useQuoteRevalidation = (
  lines: CartLine[],
  enabled: boolean,
): {
  pageStatus: QuotePageStatus
  checks: LineChecks
  retry: () => void
} => {
  const linesRef = useRef(lines)
  linesRef.current = lines

  const [pageStatus, setPageStatus] = useState<QuotePageStatus>("idle")
  const [checks, setChecks] = useState<LineChecks>({})
  const [attempt, setAttempt] = useState(0)

  const retry = () => {
    setAttempt((n) => n + 1)
  }

  // ponytail: `lines` is deliberately not a dependency — a quantity edit must
  // not refire the batch; the effect reads the current lines off the ref.
  useEffect(() => {
    if (!enabled) {
      return
    }
    const currentLines = linesRef.current
    if (currentLines.length === 0) {
      return
    }

    let isActive = true
    setPageStatus("checking")

    const revalidate = async () => {
      try {
        const data = await fetchCatalog<RevalidateData>(
          buildRevalidateUrl(currentLines),
        )
        if (!isActive) {
          return
        }
        setChecks(resolveChecks(currentLines, data))
        setPageStatus("done")
      } catch (error) {
        if (!isActive) {
          return
        }
        console.error("GET /api/catalog/revalidate failed", error)
        setPageStatus("failed")
      }
    }

    revalidate()

    return () => {
      isActive = false
    }
  }, [enabled, attempt])

  return {
    pageStatus,
    checks,
    retry,
  }
}
