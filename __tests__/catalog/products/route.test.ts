/**
 * @jest-environment node
 */
import { GET } from "@/app/api/catalog/products/route"
import {
  CAT_ERR_001,
  CAT_VAL_001,
  CAT_VAL_002,
  MSG_CAT_ERR_001,
  MSG_CAT_VAL_001,
  MSG_CAT_VAL_002,
  PRODUCT_PAGE_SIZE,
} from "@/shared/constants/catalog.constants"

const originalHost = process.env.STRAPI_HOST
const originalToken = process.env.STRAPI_API_TOKEN

const setEnv = () => {
  process.env.STRAPI_HOST = "https://strapi.example/graphql"
  process.env.STRAPI_API_TOKEN = "token"
}

const fetchProductsMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  fetchProducts: (...args: unknown[]) => fetchProductsMock(...args),
}))

afterEach(() => {
  fetchProductsMock.mockReset()
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

const requestWith = (query: string) =>
  new Request(`http://localhost/api/catalog/products${query}`)

describe("GET /api/catalog/products", () => {
  it("returns the product envelope on success and forwards the validated page", async () => {
    setEnv()
    fetchProductsMock.mockResolvedValue([
      {
        name: "Tire",
        category: { name: "Wheels" },
        brand: { name: "Acme" },
        documentId: "doc-1",
      },
    ])

    const res = await GET(requestWith("?page=3"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      data: [
        {
          name: "Tire",
          category: { name: "Wheels" },
          brand: { name: "Acme" },
          documentId: "doc-1",
        },
      ],
    })
    expect(fetchProductsMock).toHaveBeenCalledWith(3)
  })

  it("uses the default page when omitted", async () => {
    setEnv()
    fetchProductsMock.mockResolvedValue([])

    const res = await GET(requestWith(""))
    expect(res.status).toBe(200)
    expect(fetchProductsMock).toHaveBeenCalledWith(1)
  })

  it("rejects an invalid page size with CAT_VAL_002 without calling the adapter", async () => {
    setEnv()

    const res = await GET(requestWith(`?pageSize=${PRODUCT_PAGE_SIZE + 1}`))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_002,
      message: MSG_CAT_VAL_002(PRODUCT_PAGE_SIZE, PRODUCT_PAGE_SIZE + 1),
    })
    expect(fetchProductsMock).not.toHaveBeenCalled()
  })

  it("rejects a non-digit page with CAT_VAL_001", async () => {
    setEnv()

    const res = await GET(requestWith("?page=1abc"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_001,
      message: MSG_CAT_VAL_001,
    })
    expect(fetchProductsMock).not.toHaveBeenCalled()
  })

  it("maps a rejected adapter call to CAT_ERR_001", async () => {
    setEnv()
    fetchProductsMock.mockRejectedValue(new Error("up"))

    const res = await GET(requestWith("?page=1"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ERR_001,
      message: MSG_CAT_ERR_001,
    })
  })
})
