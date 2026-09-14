import {
  CONTACT_EMAIL_PATTERN,
  CONTACT_TEXT_MAX_LENGTH,
} from "@/shared/constants/cart.constants"
import type { CartContact } from "@/shared/types/global.types"

export const isValidContactName = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= CONTACT_TEXT_MAX_LENGTH

export const isValidContactEmail = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= CONTACT_TEXT_MAX_LENGTH &&
  CONTACT_EMAIL_PATTERN.test(value)

export const validateContact = (
  candidate: unknown,
): { contact: CartContact | null; partial: Partial<CartContact> } => {
  if (typeof candidate !== "object" || candidate === null) {
    return {
      contact: null,
      partial: {},
    }
  }

  const record = candidate as Record<string, unknown>
  const partial: Partial<CartContact> = {}

  if (isValidContactName(record.firstName)) {
    partial.firstName = record.firstName
  }
  if (isValidContactName(record.lastName)) {
    partial.lastName = record.lastName
  }
  if (isValidContactEmail(record.email)) {
    partial.email = record.email
  }

  if (
    partial.firstName === undefined ||
    partial.lastName === undefined ||
    partial.email === undefined
  ) {
    return {
      contact: null,
      partial,
    }
  }

  return {
    contact: {
      firstName: partial.firstName,
      lastName: partial.lastName,
      email: partial.email,
    },
    partial,
  }
}
