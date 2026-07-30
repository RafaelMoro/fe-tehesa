import { redirect } from "next/navigation"

import {
  PRODUCT_PAGE_MAX,
  PRODUCT_PAGE_MIN,
  SEARCH_TERM_MAX_LENGTH,
  SEARCH_TERM_PATTERN,
} from "@/shared/constants/catalog.constants"
import {
  fetchProducts,
  fetchProductsByBrand,
  fetchProductsByCategory,
  fetchProductsByName,
} from "@/shared/lib/global.lib"
import type {
  CatalogSelection,
  CatalogUrlState,
  MainPageSearchParams,
} from "./types.pagination"

const DIGITS_ONLY = /^[0-9]+$/

const redirectToBase = (): never => {
  return redirect("/?page=1")
}

const tryParseBasePage = (raw: string | undefined): number | null => {
  const pageParam = raw ?? "1"
  if (!DIGITS_ONLY.test(pageParam)) {
    return null
  }
  const page = Number.parseInt(pageParam, 10)
  if (page < PRODUCT_PAGE_MIN || page > PRODUCT_PAGE_MAX) {
    return null
  }
  return page
}

const tryParseWidePage = (raw: string | undefined): number | null => {
  const pageParam = raw ?? "1"
  if (!DIGITS_ONLY.test(pageParam)) {
    return null
  }
  const page = Number.parseInt(pageParam, 10)
  if (page < PRODUCT_PAGE_MIN) {
    return null
  }
  return page
}

const tryParseModeValue = (raw: string | undefined): string | null => {
  if (raw === undefined) {
    return null
  }
  const trimmed = raw.trim()
  if (
    trimmed.length === 0 ||
    trimmed.length > SEARCH_TERM_MAX_LENGTH ||
    !SEARCH_TERM_PATTERN.test(trimmed)
  ) {
    return null
  }
  return trimmed
}

/**
 * Pure parse of the same catalog URL rules `getCatalogSelection` applies,
 * returning `null` instead of redirecting. `generateMetadata` needs a parse
 * that never triggers a Next.js redirect side effect.
 */
export const parseCatalogParams = (
  params: MainPageSearchParams,
): CatalogUrlState | null => {
  if (params.mode === undefined) {
    const page = tryParseBasePage(params.page)
    if (page === null) {
      return null
    }
    return {
      mode: "base",
      value: null,
      page,
    }
  }

  if (params.mode === "name") {
    const page = tryParseWidePage(params.page)
    const value = tryParseModeValue(params.q)
    if (page === null || value === null) {
      return null
    }
    return {
      mode: "name",
      value,
      page,
    }
  }

  if (params.mode === "category") {
    const page = tryParseWidePage(params.page)
    const value = tryParseModeValue(params.category)
    if (page === null || value === null) {
      return null
    }
    return {
      mode: "category",
      value,
      page,
    }
  }

  if (params.mode === "brand") {
    const page = tryParseWidePage(params.page)
    const value = tryParseModeValue(params.brand)
    if (page === null || value === null) {
      return null
    }
    return {
      mode: "brand",
      value,
      page,
    }
  }

  return null
}

export const buildModeUrl = (
  mode: "name" | "category" | "brand",
  value: string,
  page: number,
  notice?: "end",
) => {
  const key = mode === "name" ? "q" : mode
  const params = new URLSearchParams({
    mode,
    [key]: value,
    page: String(page),
  })
  if (notice) {
    params.set("notice", notice)
  }
  return `/?${params.toString()}`
}

export const buildBasePagePath = (page: number) => {
  if (page === PRODUCT_PAGE_MIN) {
    return "/"
  }
  return `/?page=${page}`
}

export const buildCanonicalPath = (state: CatalogUrlState): string => {
  if (state.mode === "base") {
    return buildBasePagePath(state.page)
  }
  return buildModeUrl(state.mode, state.value ?? "", state.page)
}

export const buildPageOneUrl = (selection: CatalogSelection) => {
  if (selection.mode === "base") {
    return "/?page=1"
  }
  return buildModeUrl(selection.mode, selection.value ?? "", PRODUCT_PAGE_MIN)
}

export const buildPreviousNoticeUrl = (selection: CatalogSelection) => {
  const previousPage = Math.max(PRODUCT_PAGE_MIN, selection.page - 1)
  if (selection.mode === "base") {
    return `/?page=${previousPage}&notice=end`
  }
  return buildModeUrl(
    selection.mode,
    selection.value ?? "",
    previousPage,
    "end",
  )
}

export const getCatalogSelection = (
  params: MainPageSearchParams,
): CatalogSelection => {
  const state = parseCatalogParams(params)
  if (state === null) {
    return redirectToBase()
  }

  const notice = params.notice === "end" ? "end" : null
  const feedback =
    notice === "end"
      ? { kind: "status" as const, message: "No hay más resultados." }
      : null
  const hasPrevious = state.page > PRODUCT_PAGE_MIN

  if (state.mode === "base") {
    return {
      mode: "base",
      value: null,
      page: state.page,
      fetchProducts: () => fetchProducts(state.page),
      hasPrevious,
      feedback,
    }
  }

  const value = state.value ?? ""

  if (state.mode === "name") {
    return {
      mode: "name",
      value,
      page: state.page,
      fetchProducts: () => fetchProductsByName(value, state.page),
      hasPrevious,
      feedback,
    }
  }

  if (state.mode === "category") {
    return {
      mode: "category",
      value,
      page: state.page,
      fetchProducts: () => fetchProductsByCategory(value, state.page),
      hasPrevious,
      feedback,
    }
  }

  return {
    mode: "brand",
    value,
    page: state.page,
    fetchProducts: () => fetchProductsByBrand(value, state.page),
    hasPrevious,
    feedback,
  }
}
