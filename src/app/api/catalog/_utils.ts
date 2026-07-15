import { NextResponse } from "next/server"

import {
  CAT_ENV_001,
  CAT_VAL_001,
  CAT_VAL_002,
  CAT_VAL_003,
  CAT_VAL_004,
  CAT_VAL_005,
  CAT_VAL_006,
  DOCUMENT_ID_MAX_LENGTH,
  DOCUMENT_ID_PATTERN,
  MSG_CAT_ENV_001,
  MSG_CAT_VAL_001,
  MSG_CAT_VAL_002,
  MSG_CAT_VAL_003,
  MSG_CAT_VAL_004,
  MSG_CAT_VAL_005,
  MSG_CAT_VAL_006_EMPTY,
  MSG_CAT_VAL_006_LENGTH,
  MSG_CAT_VAL_006_PATTERN,
  PRODUCT_PAGE_MAX,
  PRODUCT_PAGE_MIN,
  PRODUCT_PAGE_SIZE,
  SEARCH_TERM_MAX_LENGTH,
  SEARCH_TERM_PATTERN,
  VARIANT_PAGE_SIZE,
} from "@/shared/constants/catalog.constants"
import { getStrapiConfig } from "@/shared/utils/strapi-config.utils"

export type CatalogErrorCode =
  | typeof CAT_ENV_001
  | typeof CAT_VAL_001
  | typeof CAT_VAL_002
  | typeof CAT_VAL_003
  | typeof CAT_VAL_004
  | typeof CAT_VAL_005
  | typeof CAT_VAL_006
  | "CAT_NF_001"
  | "CAT_NF_002"
  | "CAT_NF_003"
  | "CAT_ERR_001"

export type CatalogEnvelope<T> =
  | { success: true; data: T }
  | { success: false; code: CatalogErrorCode; message: string }

export type CatalogError = { code: CatalogErrorCode; message: string }

export const success = <T>(data: T) =>
  NextResponse.json<CatalogEnvelope<T>>({
    success: true,
    data,
  })

export const failure = (code: CatalogErrorCode, message: string) =>
  NextResponse.json<CatalogEnvelope<never>>(
    { success: false, code, message },
    { status: 400 },
  )

export const validateCatalogEnv = (): CatalogError | null => {
  if (!getStrapiConfig()) {
    return {
      code: CAT_ENV_001,
      message: MSG_CAT_ENV_001,
    }
  }
  return null
}

const DIGITS_ONLY = /^[0-9]+$/

const parsePage = (
  raw: string | null,
): { ok: true; value: number } | { ok: false; error: CatalogError } => {
  if (raw === null) {
    return {
      ok: true,
      value: PRODUCT_PAGE_MIN,
    }
  }
  if (!DIGITS_ONLY.test(raw)) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_001,
        message: MSG_CAT_VAL_001,
      },
    }
  }
  const value = Number.parseInt(raw, 10)
  if (
    !Number.isInteger(value) ||
    value < PRODUCT_PAGE_MIN ||
    value > PRODUCT_PAGE_MAX
  ) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_001,
        message: MSG_CAT_VAL_001,
      },
    }
  }
  return {
    ok: true,
    value,
  }
}

const parseWideSearchPage = (
  raw: string | null,
): { ok: true; value: number } | { ok: false; error: CatalogError } => {
  if (raw === null) {
    return {
      ok: true,
      value: PRODUCT_PAGE_MIN,
    }
  }
  if (!DIGITS_ONLY.test(raw)) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_001,
        message: MSG_CAT_VAL_001,
      },
    }
  }
  const value = Number.parseInt(raw, 10)
  if (!Number.isInteger(value) || value < PRODUCT_PAGE_MIN) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_001,
        message: MSG_CAT_VAL_001,
      },
    }
  }
  return {
    ok: true,
    value,
  }
}

const parsePageSize = (
  raw: string | null,
  fixedSize: number,
): { ok: true; value: number } | { ok: false; error: CatalogError } => {
  if (raw === null) {
    return {
      ok: true,
      value: fixedSize,
    }
  }
  if (!DIGITS_ONLY.test(raw)) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_002,
        message: MSG_CAT_VAL_002(fixedSize, raw),
      },
    }
  }
  const value = Number.parseInt(raw, 10)
  if (!Number.isInteger(value) || value !== fixedSize) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_002,
        message: MSG_CAT_VAL_002(fixedSize, value),
      },
    }
  }
  return {
    ok: true,
    value,
  }
}

const parseTaxonomyName = (
  raw: string | null,
  errorCode: typeof CAT_VAL_003 | typeof CAT_VAL_004,
  errorMessage: string,
): { ok: true; value: string } | { ok: false; error: CatalogError } => {
  if (raw === null) {
    return {
      ok: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    }
  }
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return {
      ok: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    }
  }
  if (
    trimmed.length > SEARCH_TERM_MAX_LENGTH ||
    !SEARCH_TERM_PATTERN.test(trimmed)
  ) {
    return {
      ok: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    }
  }
  return {
    ok: true,
    value: trimmed,
  }
}

const parseDocumentId = (
  raw: string | null,
): { ok: true; value: string } | { ok: false; error: CatalogError } => {
  if (!raw) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_005,
        message: MSG_CAT_VAL_005,
      },
    }
  }
  if (!DOCUMENT_ID_PATTERN.test(raw) || raw.length > DOCUMENT_ID_MAX_LENGTH) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_005,
        message: MSG_CAT_VAL_005,
      },
    }
  }
  return {
    ok: true,
    value: raw,
  }
}

const parseSearchTerm = (
  raw: string | null,
): { ok: true; value: string } | { ok: false; error: CatalogError } => {
  if (raw === null) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_006,
        message: MSG_CAT_VAL_006_EMPTY,
      },
    }
  }
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_006,
        message: MSG_CAT_VAL_006_EMPTY,
      },
    }
  }
  if (trimmed.length > SEARCH_TERM_MAX_LENGTH) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_006,
        message: MSG_CAT_VAL_006_LENGTH,
      },
    }
  }
  if (!SEARCH_TERM_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error: {
        code: CAT_VAL_006,
        message: MSG_CAT_VAL_006_PATTERN,
      },
    }
  }
  return {
    ok: true,
    value: trimmed,
  }
}

export const readValidatedParams = (request: Request) => {
  const url = new URL(request.url)
  const params = url.searchParams

  const page = parsePage(params.get("page"))
  const wideSearchPage = parseWideSearchPage(params.get("page"))
  const productPageSize = parsePageSize(
    params.get("pageSize"),
    PRODUCT_PAGE_SIZE,
  )
  const variantPageSize = parsePageSize(
    params.get("pageSize"),
    VARIANT_PAGE_SIZE,
  )
  const categoryName = parseTaxonomyName(
    params.get("category"),
    CAT_VAL_003,
    MSG_CAT_VAL_003,
  )
  const brandName = parseTaxonomyName(
    params.get("brand"),
    CAT_VAL_004,
    MSG_CAT_VAL_004,
  )
  const documentId = parseDocumentId(params.get("documentId"))
  const searchTerm = parseSearchTerm(params.get("q"))

  return {
    page,
    wideSearchPage,
    productPageSize,
    variantPageSize,
    categoryName,
    brandName,
    documentId,
    searchTerm,
  }
}
