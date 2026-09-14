import {
  isValidContactEmail,
  isValidContactName,
  validateContact,
} from "@/shared/utils/contact-validation.utils"
import { CONTACT_TEXT_MAX_LENGTH } from "@/shared/constants/cart.constants"

describe("isValidContactName", () => {
  it("accepts a normal name", () => {
    expect(isValidContactName("Ana")).toBe(true)
  })

  it("rejects an empty string", () => {
    expect(isValidContactName("")).toBe(false)
  })

  it("rejects a value over the max length", () => {
    expect(isValidContactName("a".repeat(CONTACT_TEXT_MAX_LENGTH + 1))).toBe(
      false,
    )
  })

  it("rejects a non-string value", () => {
    expect(isValidContactName(42)).toBe(false)
  })
})

describe("isValidContactEmail", () => {
  it("accepts a well-formed email", () => {
    expect(isValidContactEmail("ana@example.com")).toBe(true)
  })

  it("rejects a malformed email", () => {
    expect(isValidContactEmail("not-an-email")).toBe(false)
  })

  it("rejects an empty string", () => {
    expect(isValidContactEmail("")).toBe(false)
  })
})

describe("validateContact", () => {
  it("returns a full contact and matching partial when all fields pass", () => {
    const candidate = {
      firstName: "Ana",
      lastName: "Pérez",
      email: "ana@example.com",
    }

    const { contact, partial } = validateContact(candidate)

    expect(contact).toEqual(candidate)
    expect(partial).toEqual(candidate)
  })

  it("keeps only the fields that pass when the email is invalid", () => {
    const { contact, partial } = validateContact({
      firstName: "Ana",
      lastName: "Pérez",
      email: "bad-email",
    })

    expect(contact).toBeNull()
    expect(partial).toEqual({ firstName: "Ana", lastName: "Pérez" })
  })

  it("returns an empty partial for a non-object value", () => {
    expect(validateContact("not-an-object")).toEqual({
      contact: null,
      partial: {},
    })
    expect(validateContact(null)).toEqual({ contact: null, partial: {} })
  })
})
