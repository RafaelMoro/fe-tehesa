/**
 * @jest-environment node
 */
import { GET } from "@/app/api/catalog/category/route"
import {
  CAT_ERR_001,
  CAT_NF_001,
  CAT_VAL_003,
  MSG_CAT_ERR_001,
  MSG_CAT_NF_001,
  MSG_CAT_VAL_003,
} from "@/shared/constants/catalog.constants"
import type { TaxonomyItem } from "@/shared/types/global.types"

const originalHost = process.env.STRAPI_HOST
const originalToken = process.env.STRAPI_API_TOKEN

const setEnv = () => {
  process.env.STRAPI_HOST = "https://strapi.example/graphql"
  process.env.STRAPI_API_TOKEN = "token"
}

const fetchCategoriesMock = jest.fn()
const fetchProductsByCategoryMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  fetchCategories: (...args: unknown[]) => fetchCategoriesMock(...args),
  fetchProductsByCategory: (...args: unknown[]) =>
    fetchProductsByCategoryMock(...args),
}))

afterEach(() => {
  fetchCategoriesMock.mockReset()
  fetchProductsByCategoryMock.mockReset()
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

const categories: TaxonomyItem[] = [{ name: "Tubes", customId: "tubes" }]
const products = [
  {
    name: "Tire",
    category: { name: "Tubes" },
    brand: { name: "Acme" },
    documentId: "doc-1",
  },
]

const requestWith = (query: string) =>
  new Request(`http://localhost/api/catalog/category${query}`)

describe("GET /api/catalog/category", () => {
  it("returns the product envelope on success and forwards category + page", async () => {
    setEnv()
    fetchCategoriesMock.mockResolvedValue(categories)
    fetchProductsByCategoryMock.mockResolvedValue(products)

    const res = await GET(requestWith("?categoryId=tubes&page=2"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: products })
    expect(fetchProductsByCategoryMock).toHaveBeenCalledWith("tubes", 2)
  })

  it("rejects an invalid categoryId with CAT_VAL_003", async () => {
    setEnv()

    const res = await GET(requestWith("?categoryId=bad!id"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_003,
      message: MSG_CAT_VAL_003,
    })
    expect(fetchProductsByCategoryMock).not.toHaveBeenCalled()
  })

  it("returns CAT_NF_001 when the category does not exist and skips the product call", async () => {
    setEnv()
    fetchCategoriesMock.mockResolvedValue(categories)

    const res = await GET(requestWith("?categoryId=unknown"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_NF_001,
      message: MSG_CAT_NF_001,
    })
    expect(fetchProductsByCategoryMock).not.toHaveBeenCalled()
  })

  it("maps a rejected product adapter to CAT_ERR_001", async () => {
    setEnv()
    fetchCategoriesMock.mockResolvedValue(categories)
    fetchProductsByCategoryMock.mockRejectedValue(new Error("up"))

    const res = await GET(requestWith("?categoryId=tubes"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ERR_001,
      message: MSG_CAT_ERR_001,
    })
  })

  it("maps a rejected taxonomy adapter to CAT_ERR_001", async () => {
    setEnv()
    fetchCategoriesMock.mockRejectedValue(new Error("up"))

    const res = await GET(requestWith("?categoryId=tubes"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ERR_001,
      message: MSG_CAT_ERR_001,
    })
    expect(fetchProductsByCategoryMock).not.toHaveBeenCalled()
  })
})
