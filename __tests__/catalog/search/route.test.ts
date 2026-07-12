/**
 * @jest-environment node
 */
import { GET } from "@/app/api/catalog/search/route"
import {
  CAT_ERR_001,
  CAT_VAL_006,
  MSG_CAT_ERR_001,
  MSG_CAT_VAL_006_EMPTY,
} from "@/shared/constants/catalog.constants"

const originalHost = process.env.STRAPI_HOST
const originalToken = process.env.STRAPI_API_TOKEN

const setEnv = () => {
  process.env.STRAPI_HOST = "https://strapi.example/graphql"
  process.env.STRAPI_API_TOKEN = "token"
}

const fetchProductsByNameMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  fetchProductsByName: (...args: unknown[]) => fetchProductsByNameMock(...args),
}))

afterEach(() => {
  fetchProductsByNameMock.mockReset()
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

const products = [
  {
    name: "Tire",
    category: { name: "Tubes" },
    brand: { name: "Acme" },
    documentId: "doc-1",
  },
]

const requestWith = (query: string) =>
  new Request(`http://localhost/api/catalog/search${query}`)

describe("GET /api/catalog/search", () => {
  it("returns the product envelope on success and forwards the trimmed term and wide page", async () => {
    setEnv()
    fetchProductsByNameMock.mockResolvedValue(products)

    const res = await GET(requestWith("?q=%20%20tehesa%20%20&page=3"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: products })
    expect(fetchProductsByNameMock).toHaveBeenCalledWith("tehesa", 3)
  })

  it("rejects an empty search term with CAT_VAL_006 without calling the adapter", async () => {
    setEnv()

    const res = await GET(requestWith("?q="))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_006,
      message: MSG_CAT_VAL_006_EMPTY,
    })
    expect(fetchProductsByNameMock).not.toHaveBeenCalled()
  })

  it("maps a rejected adapter call to CAT_ERR_001", async () => {
    setEnv()
    fetchProductsByNameMock.mockRejectedValue(new Error("up"))

    const res = await GET(requestWith("?q=tehesa"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ERR_001,
      message: MSG_CAT_ERR_001,
    })
  })
})
