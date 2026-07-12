/**
 * @jest-environment node
 */
import { GET } from "@/app/api/catalog/brand/route"
import {
  CAT_ERR_001,
  CAT_NF_002,
  CAT_VAL_004,
  MSG_CAT_ERR_001,
  MSG_CAT_NF_002,
  MSG_CAT_VAL_004,
} from "@/shared/constants/catalog.constants"
import type { TaxonomyItem } from "@/shared/types/global.types"

const originalHost = process.env.STRAPI_HOST
const originalToken = process.env.STRAPI_API_TOKEN

const setEnv = () => {
  process.env.STRAPI_HOST = "https://strapi.example/graphql"
  process.env.STRAPI_API_TOKEN = "token"
}

const fetchBrandsMock = jest.fn()
const fetchProductsByBrandMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  fetchBrands: (...args: unknown[]) => fetchBrandsMock(...args),
  fetchProductsByBrand: (...args: unknown[]) =>
    fetchProductsByBrandMock(...args),
}))

afterEach(() => {
  fetchBrandsMock.mockReset()
  fetchProductsByBrandMock.mockReset()
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

const brands: TaxonomyItem[] = [{ name: "Acme", customId: "acme" }]
const products = [
  {
    name: "Tire",
    category: { name: "Tubes" },
    brand: { name: "Acme" },
    documentId: "doc-1",
  },
]

const requestWith = (query: string) =>
  new Request(`http://localhost/api/catalog/brand${query}`)

describe("GET /api/catalog/brand", () => {
  it("returns the product envelope on success and forwards brand + page", async () => {
    setEnv()
    fetchBrandsMock.mockResolvedValue(brands)
    fetchProductsByBrandMock.mockResolvedValue(products)

    const res = await GET(requestWith("?brandId=acme&page=2"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: products })
    expect(fetchProductsByBrandMock).toHaveBeenCalledWith("acme", 2)
  })

  it("rejects an invalid brandId with CAT_VAL_004", async () => {
    setEnv()

    const res = await GET(requestWith("?brandId=bad!id"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_004,
      message: MSG_CAT_VAL_004,
    })
    expect(fetchProductsByBrandMock).not.toHaveBeenCalled()
  })

  it("returns CAT_NF_002 when the brand does not exist and skips the product call", async () => {
    setEnv()
    fetchBrandsMock.mockResolvedValue(brands)

    const res = await GET(requestWith("?brandId=unknown"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_NF_002,
      message: MSG_CAT_NF_002,
    })
    expect(fetchProductsByBrandMock).not.toHaveBeenCalled()
  })

  it("maps a rejected product adapter to CAT_ERR_001", async () => {
    setEnv()
    fetchBrandsMock.mockResolvedValue(brands)
    fetchProductsByBrandMock.mockRejectedValue(new Error("up"))

    const res = await GET(requestWith("?brandId=acme"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ERR_001,
      message: MSG_CAT_ERR_001,
    })
  })
})
