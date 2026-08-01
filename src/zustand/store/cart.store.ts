import { createContext } from "react"
import { createStore } from "zustand/vanilla"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"

import {
  DOCUMENT_ID_MAX_LENGTH,
  DOCUMENT_ID_PATTERN,
} from "@/shared/constants/catalog.constants"
import {
  CART_MAX_LINES,
  CART_MAX_QUANTITY,
  CART_MIN_QUANTITY,
  CART_SCHEMA_VERSION,
  CART_STORAGE_KEY,
  CART_TEXT_MAX_LENGTH,
  CONTACT_EMAIL_PATTERN,
  CONTACT_TEXT_MAX_LENGTH,
  NO_VARIANT_KEY,
} from "@/shared/constants/cart.constants"
import type {
  CartContact,
  CartLine,
  CartProductLine,
  CartVariantLine,
} from "@/shared/types/global.types"

export type CartState = {
  lines: CartLine[]
  contact: CartContact | null
}

export type CartAddResult = {
  added: number
  incremented: number
  rejected: boolean
}

export type CartUpgradeResult = "upgraded" | "merged" | "missing"

export type CartActions = {
  addVariantLines: (inputs: CartVariantLine[]) => CartAddResult
  addProductLine: (input: CartProductLine) => CartAddResult
  clearLines: () => void
  setContact: (contact: CartContact) => void
  clearContact: () => void
  setLineQuantity: (key: string, quantity: number) => void
  removeLine: (key: string) => void
  upgradeLine: (key: string, line: CartVariantLine) => CartUpgradeResult
}

export type CartStore = CartState & CartActions

export const defaultCartState: CartState = {
  lines: [],
  contact: null,
}

export const cartLineKey = (
  line: Pick<CartLine, "productDocumentId" | "variantDocumentId">,
) => `${line.productDocumentId}:${line.variantDocumentId ?? NO_VARIANT_KEY}`

const isNonEmptyString = (value: unknown, maxLength: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= maxLength

const isValidDocumentId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= DOCUMENT_ID_MAX_LENGTH &&
  DOCUMENT_ID_PATTERN.test(value)

export const isValidCartLine = (value: unknown): value is CartLine => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (!isValidDocumentId(candidate.productDocumentId)) {
    return false
  }

  if (!isNonEmptyString(candidate.productName, CART_TEXT_MAX_LENGTH)) {
    return false
  }

  if (
    !Number.isInteger(candidate.quantity) ||
    (candidate.quantity as number) < CART_MIN_QUANTITY ||
    (candidate.quantity as number) > CART_MAX_QUANTITY
  ) {
    return false
  }

  if (candidate.variantDocumentId === null) {
    return candidate.unitPrice === null
  }

  if (!isValidDocumentId(candidate.variantDocumentId)) {
    return false
  }

  if (!isNonEmptyString(candidate.diameter, CART_TEXT_MAX_LENGTH)) {
    return false
  }

  if (
    typeof candidate.unitPrice !== "number" ||
    !Number.isFinite(candidate.unitPrice) ||
    candidate.unitPrice < 0
  ) {
    return false
  }

  if (
    candidate.internalId !== undefined &&
    !isNonEmptyString(candidate.internalId, CART_TEXT_MAX_LENGTH)
  ) {
    return false
  }

  return true
}

const sanitizeContact = (value: unknown): CartContact | null => {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const candidate = value as Record<string, unknown>

  if (
    !isNonEmptyString(candidate.firstName, CONTACT_TEXT_MAX_LENGTH) ||
    !isNonEmptyString(candidate.lastName, CONTACT_TEXT_MAX_LENGTH)
  ) {
    return null
  }

  if (
    !isNonEmptyString(candidate.email, CONTACT_TEXT_MAX_LENGTH) ||
    !CONTACT_EMAIL_PATTERN.test(candidate.email)
  ) {
    return null
  }

  return {
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
  }
}

export const sanitizeCartState = (value: unknown): CartState => {
  if (typeof value !== "object" || value === null) {
    return { ...defaultCartState }
  }

  const candidate = value as Record<string, unknown>

  const lines = Array.isArray(candidate.lines)
    ? candidate.lines.slice(0, CART_MAX_LINES).filter(isValidCartLine)
    : []

  return {
    lines,
    contact: sanitizeContact(candidate.contact),
  }
}

// ponytail: persist failures are swallowed; the in-memory cart still works for the session
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // swallow - Safari private mode / quota exceeded must not break the add
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // swallow
    }
  },
}

const addLines = (
  currentLines: CartLine[],
  inputs: CartLine[],
): { lines: CartLine[]; result: CartAddResult } => {
  const linesByKey = new Map(
    currentLines.map((line) => [cartLineKey(line), line] as const),
  )
  const existingKeyCount = linesByKey.size
  const newKeys = new Set<string>()

  for (const input of inputs) {
    const key = cartLineKey(input)
    if (!linesByKey.has(key)) {
      newKeys.add(key)
    }
  }

  if (existingKeyCount + newKeys.size > CART_MAX_LINES) {
    return {
      lines: currentLines,
      result: { added: 0, incremented: 0, rejected: true },
    }
  }

  let added = 0
  let incremented = 0

  for (const input of inputs) {
    const key = cartLineKey(input)
    const existing = linesByKey.get(key)

    if (existing) {
      const nextQuantity = Math.min(
        existing.quantity + input.quantity,
        CART_MAX_QUANTITY,
      )
      linesByKey.set(key, { ...existing, quantity: nextQuantity })
      incremented += 1
    } else {
      linesByKey.set(key, input)
      added += 1
    }
  }

  return {
    lines: Array.from(linesByKey.values()),
    result: { added, incremented, rejected: false },
  }
}

export const createCartStore = (initState: CartState = defaultCartState) => {
  return createStore<CartStore>()(
    persist(
      (set, get) => ({
        ...initState,
        addVariantLines: (inputs) => {
          const { lines, result } = addLines(get().lines, inputs)
          if (!result.rejected) {
            set({ lines })
          }
          return result
        },
        addProductLine: (input) => {
          const { lines, result } = addLines(get().lines, [input])
          if (!result.rejected) {
            set({ lines })
          }
          return result
        },
        clearLines: () => set({ lines: [] }),
        setContact: (contact) => set({ contact }),
        clearContact: () => set({ contact: null }),
        setLineQuantity: (key, quantity) => {
          if (!Number.isFinite(quantity)) {
            return
          }
          const clamped = Math.min(
            Math.max(Math.trunc(quantity), CART_MIN_QUANTITY),
            CART_MAX_QUANTITY,
          )
          set({
            lines: get().lines.map((line) =>
              cartLineKey(line) === key ? { ...line, quantity: clamped } : line,
            ),
          })
        },
        removeLine: (key) => {
          set({
            lines: get().lines.filter((line) => cartLineKey(line) !== key),
          })
        },
        upgradeLine: (key, line) => {
          const currentLines = get().lines
          const index = currentLines.findIndex(
            (existing) => cartLineKey(existing) === key,
          )
          if (index === -1) {
            return "missing"
          }

          const nextKey = cartLineKey(line)
          const collisionIndex = currentLines.findIndex(
            (existing, i) => i !== index && cartLineKey(existing) === nextKey,
          )

          if (collisionIndex === -1) {
            const nextLines = [...currentLines]
            nextLines[index] = line
            set({ lines: nextLines })
            return "upgraded"
          }

          const collided = currentLines[collisionIndex]
          const mergedQuantity = Math.min(
            collided.quantity + line.quantity,
            CART_MAX_QUANTITY,
          )
          const nextLines = currentLines
            .filter((_, i) => i !== index)
            .map((existing) =>
              cartLineKey(existing) === nextKey
                ? { ...existing, quantity: mergedQuantity }
                : existing,
            )
          set({ lines: nextLines })
          return "merged"
        },
      }),
      {
        name: CART_STORAGE_KEY,
        version: CART_SCHEMA_VERSION,
        storage: createJSONStorage(() =>
          typeof window === "undefined"
            ? (undefined as unknown as StateStorage)
            : safeLocalStorage,
        ),
        // drop-on-version-mismatch: a cart from an older build must not reach this build's
        // code paths; losing an unsent cart across a deploy is acceptable, crashing is not
        migrate: () => defaultCartState,
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...sanitizeCartState(persistedState),
        }),
      },
    ),
  )
}

export type CartStoreApi = ReturnType<typeof createCartStore>
export const CartStoreContext = createContext<CartStoreApi | undefined>(
  undefined,
)
