/**
 * @jest-environment node
 */
import {
  CAT_ENV_001,
  CAT_VAL_001,
  CAT_VAL_002,
  CAT_VAL_003,
  CAT_VAL_004,
  CAT_VAL_005,
  CAT_VAL_006,
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
  VARIANT_PAGE_SIZE,
} from "@/shared/constants/catalog.constants"
/**
 * @jest-environment node
 */
import {
  failure,
  readValidatedParams,
  success,
  validateCatalogEnv,
} from "@/app/api/catalog/_utils"

const requestWith = (query: string) =>
  new Request(`http://localhost/api/catalog/products${query}`)

describe("catalog _utils", () => {
  describe("success", () => {
    it("returns a 200 envelope with the data field", async () => {
      const res = success(["a", "b"])
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true, data: ["a", "b"] })
    })
  })

  describe("failure", () => {
    it("returns a 400 envelope with code and message", async () => {
      const res = failure(CAT_VAL_001, "boom")
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({
        success: false,
        code: CAT_VAL_001,
        message: "boom",
      })
    })
  })

  describe("validateCatalogEnv", () => {
    const originalHost = process.env.STRAPI_HOST
    const originalToken = process.env.STRAPI_API_TOKEN

    afterEach(() => {
      if (originalHost === undefined) {
        delete process.env.STRAPI_HOST
      } else {
        process.env.STRAPI_HOST = originalHost
      }
      if (originalToken === undefined) {
        delete process.env.STRAPI_API_TOKEN
      } else {
        process.env.STRAPI_API_TOKEN = originalToken
      }
    })

    it("returns null when both env vars are set", () => {
      process.env.STRAPI_HOST = "https://strapi.example/graphql"
      process.env.STRAPI_API_TOKEN = "token"
      expect(validateCatalogEnv()).toBeNull()
    })

    it("returns CAT_ENV_001 when host is missing", () => {
      delete process.env.STRAPI_HOST
      process.env.STRAPI_API_TOKEN = "token"
      expect(validateCatalogEnv()).toEqual({
        code: CAT_ENV_001,
        message: MSG_CAT_ENV_001,
      })
    })

    it("returns CAT_ENV_001 when token is missing", () => {
      process.env.STRAPI_HOST = "https://strapi.example/graphql"
      delete process.env.STRAPI_API_TOKEN
      expect(validateCatalogEnv()).toEqual({
        code: CAT_ENV_001,
        message: MSG_CAT_ENV_001,
      })
    })

    it("returns CAT_ENV_001 when both are missing", () => {
      delete process.env.STRAPI_HOST
      delete process.env.STRAPI_API_TOKEN
      expect(validateCatalogEnv()).toEqual({
        code: CAT_ENV_001,
        message: MSG_CAT_ENV_001,
      })
    })

    it("returns CAT_ENV_001 when host is relative", () => {
      process.env.STRAPI_HOST = "/graphql"
      process.env.STRAPI_API_TOKEN = "token"
      expect(validateCatalogEnv()).toEqual({
        code: CAT_ENV_001,
        message: MSG_CAT_ENV_001,
      })
    })
  })

  describe("readValidatedParams - product page (parsePage)", () => {
    it.each([
      ["omitted", undefined, PRODUCT_PAGE_MIN],
      ["1", "1", 1],
      ["3", "3", 3],
      ["6", "6", 6],
      ["7 (max)", String(PRODUCT_PAGE_MAX), PRODUCT_PAGE_MAX],
    ])("accepts %s as page %i", (_label, raw, expected) => {
      const url = raw === undefined ? "" : `?page=${raw}`
      const { page } = readValidatedParams(requestWith(url))
      expect(page).toEqual({ ok: true, value: expected })
    })

    it.each([
      ["empty", ""],
      ["0", "0"],
      ["8 (over max)", "8"],
      ["1.5 (decimal)", "1.5"],
      ["1abc (prefix)", "1abc"],
      ["abc1 (suffix)", "abc1"],
      ["-1 (signed)", "-1"],
      ["+1 (signed)", "+1"],
      ["  1  (whitespace)", "  1  "],
    ])("rejects %s with CAT_VAL_001", (_label, raw) => {
      const { page } = readValidatedParams(requestWith(`?page=${raw}`))
      expect(page).toEqual({
        ok: false,
        error: { code: CAT_VAL_001, message: MSG_CAT_VAL_001 },
      })
    })
  })

  describe("readValidatedParams - wide search page (parseWideSearchPage)", () => {
    it.each([
      ["omitted", undefined, PRODUCT_PAGE_MIN],
      ["1", "1", 1],
      ["very large", "999999", 999999],
    ])("accepts %s", (_label, raw, expected) => {
      const url = raw === undefined ? "" : `?page=${raw}`
      const { wideSearchPage } = readValidatedParams(requestWith(url))
      expect(wideSearchPage).toEqual({ ok: true, value: expected })
    })

    it("rejects 0 with CAT_VAL_001", () => {
      const { wideSearchPage } = readValidatedParams(requestWith("?page=0"))
      expect(wideSearchPage).toEqual({
        ok: false,
        error: { code: CAT_VAL_001, message: MSG_CAT_VAL_001 },
      })
    })

    it("rejects decimal page values with CAT_VAL_001", () => {
      const { wideSearchPage } = readValidatedParams(requestWith("?page=1.5"))
      expect(wideSearchPage).toEqual({
        ok: false,
        error: { code: CAT_VAL_001, message: MSG_CAT_VAL_001 },
      })
    })
  })

  describe("readValidatedParams - product page size (parsePageSize 50)", () => {
    it("defaults to PRODUCT_PAGE_SIZE when omitted", () => {
      const { productPageSize } = readValidatedParams(requestWith(""))
      expect(productPageSize).toEqual({ ok: true, value: PRODUCT_PAGE_SIZE })
    })

    it("accepts only the exact configured value", () => {
      const { productPageSize } = readValidatedParams(
        requestWith(`?pageSize=${PRODUCT_PAGE_SIZE}`),
      )
      expect(productPageSize).toEqual({
        ok: true,
        value: PRODUCT_PAGE_SIZE,
      })
    })

    it("rejects 50abc with CAT_VAL_002", () => {
      const { productPageSize } = readValidatedParams(
        requestWith("?pageSize=50abc"),
      )
      expect(productPageSize.ok).toBe(false)
      if (productPageSize.ok) {
        return
      }
      expect(productPageSize.error.code).toBe(CAT_VAL_002)
      expect(productPageSize.error.message).toBe(
        MSG_CAT_VAL_002(PRODUCT_PAGE_SIZE, "50abc"),
      )
    })

    it("rejects 100 (variant size) with CAT_VAL_002", () => {
      const { productPageSize } = readValidatedParams(
        requestWith(`?pageSize=${VARIANT_PAGE_SIZE}`),
      )
      expect(productPageSize.ok).toBe(false)
      if (productPageSize.ok) {
        return
      }
      expect(productPageSize.error.code).toBe(CAT_VAL_002)
    })

    it("rejects 0 with CAT_VAL_002", () => {
      const { productPageSize } = readValidatedParams(
        requestWith("?pageSize=0"),
      )
      expect(productPageSize.ok).toBe(false)
      if (productPageSize.ok) {
        return
      }
      expect(productPageSize.error.code).toBe(CAT_VAL_002)
    })
  })

  describe("readValidatedParams - variant page size (parsePageSize 100)", () => {
    it("defaults to VARIANT_PAGE_SIZE when omitted", () => {
      const { variantPageSize } = readValidatedParams(requestWith(""))
      expect(variantPageSize).toEqual({ ok: true, value: VARIANT_PAGE_SIZE })
    })

    it("accepts only 100", () => {
      const { variantPageSize } = readValidatedParams(
        requestWith("?pageSize=100"),
      )
      expect(variantPageSize).toEqual({ ok: true, value: VARIANT_PAGE_SIZE })
    })

    it("rejects 50 (product size) with CAT_VAL_002", () => {
      const { variantPageSize } = readValidatedParams(
        requestWith("?pageSize=50"),
      )
      expect(variantPageSize.ok).toBe(false)
      if (variantPageSize.ok) {
        return
      }
      expect(variantPageSize.error.code).toBe(CAT_VAL_002)
    })
  })

  describe("readValidatedParams - taxonomy names", () => {
    it("trims and accepts a valid category name", () => {
      const { categoryName } = readValidatedParams(
        requestWith("?category=%20Tubos%20y%20conexiones%20"),
      )
      expect(categoryName).toEqual({
        ok: true,
        value: "Tubos y conexiones",
      })
    })

    it("rejects an empty category name with CAT_VAL_003", () => {
      const { categoryName } = readValidatedParams(requestWith("?category="))
      expect(categoryName).toEqual({
        ok: false,
        error: { code: CAT_VAL_003, message: MSG_CAT_VAL_003 },
      })
    })

    it("rejects an unsafe category name pattern with CAT_VAL_003", () => {
      const { categoryName } = readValidatedParams(
        requestWith("?category=cat%2F1"),
      )
      expect(categoryName.ok).toBe(false)
      if (categoryName.ok) {
        return
      }
      expect(categoryName.error.code).toBe(CAT_VAL_003)
    })

    it(`rejects a category name longer than ${SEARCH_TERM_MAX_LENGTH} chars with CAT_VAL_003`, () => {
      const longName = "a".repeat(SEARCH_TERM_MAX_LENGTH + 1)
      const { categoryName } = readValidatedParams(
        requestWith(`?category=${longName}`),
      )
      expect(categoryName.ok).toBe(false)
      if (categoryName.ok) {
        return
      }
      expect(categoryName.error.code).toBe(CAT_VAL_003)
    })

    it("accepts a valid brand name", () => {
      const { brandName } = readValidatedParams(requestWith("?brand=Acme%20MX"))
      expect(brandName).toEqual({
        ok: true,
        value: "Acme MX",
      })
    })

    it("rejects an empty brand name with CAT_VAL_004", () => {
      const { brandName } = readValidatedParams(requestWith("?brand="))
      expect(brandName).toEqual({
        ok: false,
        error: { code: CAT_VAL_004, message: MSG_CAT_VAL_004 },
      })
    })
  })

  describe("readValidatedParams - documentId", () => {
    it("accepts a valid documentId", () => {
      const { documentId } = readValidatedParams(
        requestWith("?documentId=doc-1"),
      )
      expect(documentId).toEqual({ ok: true, value: "doc-1" })
    })

    it("rejects an empty documentId with CAT_VAL_005", () => {
      const { documentId } = readValidatedParams(requestWith("?documentId="))
      expect(documentId).toEqual({
        ok: false,
        error: { code: CAT_VAL_005, message: MSG_CAT_VAL_005 },
      })
    })

    it("rejects a malformed documentId with CAT_VAL_005", () => {
      const { documentId } = readValidatedParams(
        requestWith("?documentId=doc@1"),
      )
      expect(documentId.ok).toBe(false)
      if (documentId.ok) {
        return
      }
      expect(documentId.error.code).toBe(CAT_VAL_005)
    })
  })

  describe("readValidatedParams - search term", () => {
    it("trims surrounding whitespace and accepts the term", () => {
      const { searchTerm } = readValidatedParams(
        requestWith("?q=%20%20tehesa%20%20"),
      )
      expect(searchTerm).toEqual({ ok: true, value: "tehesa" })
    })

    it("rejects an empty search term with CAT_VAL_006 empty message", () => {
      const { searchTerm } = readValidatedParams(requestWith("?q="))
      expect(searchTerm).toEqual({
        ok: false,
        error: { code: CAT_VAL_006, message: MSG_CAT_VAL_006_EMPTY },
      })
    })

    it("rejects a search term longer than the max with the length message", () => {
      const tooLong = "a".repeat(SEARCH_TERM_MAX_LENGTH + 1)
      const { searchTerm } = readValidatedParams(requestWith(`?q=${tooLong}`))
      expect(searchTerm).toEqual({
        ok: false,
        error: { code: CAT_VAL_006, message: MSG_CAT_VAL_006_LENGTH },
      })
    })

    it("rejects a search term with unsafe characters using the pattern message", () => {
      const { searchTerm } = readValidatedParams(requestWith("?q=tehesa%2F"))
      expect(searchTerm).toEqual({
        ok: false,
        error: { code: CAT_VAL_006, message: MSG_CAT_VAL_006_PATTERN },
      })
    })
  })
})
