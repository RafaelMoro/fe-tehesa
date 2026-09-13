import { CART_MAX_LINES } from "@/shared/constants/cart.constants"

export const CAT_ENV_001 = "CAT_ENV_001"
export const CAT_VAL_001 = "CAT_VAL_001"
export const CAT_VAL_002 = "CAT_VAL_002"
export const CAT_VAL_003 = "CAT_VAL_003"
export const CAT_VAL_004 = "CAT_VAL_004"
export const CAT_VAL_005 = "CAT_VAL_005"
export const CAT_VAL_006 = "CAT_VAL_006"
export const CAT_VAL_007 = "CAT_VAL_007"
export const CAT_NF_001 = "CAT_NF_001"
export const CAT_NF_002 = "CAT_NF_002"
export const CAT_NF_003 = "CAT_NF_003"
export const CAT_ERR_001 = "CAT_ERR_001"

export const MSG_CAT_ENV_001 = "Missing Strapi configuration"
export const MSG_CAT_VAL_001 = "Invalid page parameter"
export const MSG_CAT_VAL_002 = (fixedSize: number, value: unknown) =>
  `pageSize must equal ${fixedSize}, got ${String(value)}`
export const MSG_CAT_VAL_003 = "Invalid category name"
export const MSG_CAT_VAL_004 = "Invalid brand name"
export const MSG_CAT_VAL_005 = "Invalid documentId"
export const MSG_CAT_VAL_006 = "Invalid search term"
export const MSG_CAT_VAL_006_EMPTY = "Invalid search term: empty"
export const MSG_CAT_VAL_006_LENGTH = "Invalid search term: over length"
export const MSG_CAT_VAL_006_PATTERN = "Invalid search term: unsafe characters"
export const MSG_CAT_VAL_007_PATTERN = "Invalid id list: id contains unsafe characters"
export const MSG_CAT_VAL_007_LENGTH = "Invalid id list: id over max length"
export const MSG_CAT_VAL_007_EMPTY = "Invalid id list: empty segment"
export const MSG_CAT_VAL_007_COUNT = (max: number, got: number) =>
  `Invalid id list: ${got} ids, max ${max}`
export const MSG_CAT_NF_001 = "Category not found"
export const MSG_CAT_NF_002 = "Brand not found"
export const MSG_CAT_NF_003 = "Product not found"
export const MSG_CAT_ERR_001 = "Upstream catalog error"

export const PRODUCT_PAGE_SIZE = 50
export const VARIANT_PAGE_SIZE = 100
export const PRODUCT_PAGE_MIN = 1
export const KNOWN_PRODUCT_TOTAL = 333
export const PRODUCT_PAGE_MAX = Math.ceil(
  KNOWN_PRODUCT_TOTAL / PRODUCT_PAGE_SIZE,
)
export const DOCUMENT_ID_MAX_LENGTH = 30
export const DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/
export const SEARCH_TERM_MAX_LENGTH = 100
const SEARCH_TERM_CHARS = String.raw`\p{L}\p{N}\s\-_.,&()"\/°#`
export const SEARCH_TERM_PATTERN = new RegExp(`^[${SEARCH_TERM_CHARS}]+$`, "u")
export const SEARCH_TERM_UNSAFE_PATTERN = new RegExp(
  `[^${SEARCH_TERM_CHARS}]+`,
  "u",
)
export const REVALIDATE_MAX_IDS = CART_MAX_LINES
