/**
 * @jest-environment node
 */
import { GET } from "@/app/api/catalog/variants/route"
import {
  CAT_ERR_001,
  CAT_VAL_002,
  CAT_VAL_005,
  MSG_CAT_ERR_001,
  MSG_CAT_VAL_002,
  MSG_CAT_VAL_005,
  VARIANT_PAGE_SIZE,
} from "@/shared/constants/catalog.constants"

const originalHost = process.env.STRAPI_HOST
const originalToken = process.env.STRAPI_API_TOKEN

const setEnv = () => {
  process.env.STRAPI_HOST = "https://strapi.example/graphql"
  process.env.STRAPI_API_TOKEN = "token"
}

const fetchProductVariantsMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  fetchProductVariants: (...args: unknown[]) =>
    fetchProductVariantsMock(...args),
}))

afterEach(() => {
  fetchProductVariantsMock.mockReset()
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

const variants = [{ diameter: '15"', pricing: { price: 100 } }]

const requestWith = (query: string) =>
  new Request(`http://localhost/api/catalog/variants${query}`)

describe("GET /api/catalog/variants", () => {
  it("forwards documentId and returns the exact variant envelope", async () => {
    setEnv()
    fetchProductVariantsMock.mockResolvedValue(variants)

    const res = await GET(requestWith("?documentId=doc-1"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: variants })
    expect(fetchProductVariantsMock).toHaveBeenCalledWith({
      documentId: "doc-1",
    })
  })

  it("rejects an invalid documentId with CAT_VAL_005", async () => {
    setEnv()

    const res = await GET(requestWith("?documentId=bad!id"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_005,
      message: MSG_CAT_VAL_005,
    })
    expect(fetchProductVariantsMock).not.toHaveBeenCalled()
  })

  it("rejects an invalid fixed page size with CAT_VAL_002", async () => {
    setEnv()

    const res = await GET(
      requestWith(`?documentId=doc-1&pageSize=${VARIANT_PAGE_SIZE - 1}`),
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_002,
      message: MSG_CAT_VAL_002(VARIANT_PAGE_SIZE, VARIANT_PAGE_SIZE - 1),
    })
    expect(fetchProductVariantsMock).not.toHaveBeenCalled()
  })

  it("maps a rejected adapter call to CAT_ERR_001", async () => {
    setEnv()
    fetchProductVariantsMock.mockRejectedValue(new Error("up"))

    const res = await GET(requestWith("?documentId=doc-1"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ERR_001,
      message: MSG_CAT_ERR_001,
    })
  })
})
