/**
 * @jest-environment node
 */
import { GET } from "@/app/api/catalog/brands/route"
import {
  CAT_ERR_001,
  MSG_CAT_ERR_001,
} from "@/shared/constants/catalog.constants"

const originalHost = process.env.STRAPI_HOST
const originalToken = process.env.STRAPI_API_TOKEN

const setEnv = () => {
  process.env.STRAPI_HOST = "https://strapi.example/graphql"
  process.env.STRAPI_API_TOKEN = "token"
}

const fetchBrandsMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  fetchBrands: (...args: unknown[]) => fetchBrandsMock(...args),
}))

afterEach(() => {
  fetchBrandsMock.mockReset()
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

describe("GET /api/catalog/brands", () => {
  it("returns the taxonomy envelope on success", async () => {
    setEnv()
    fetchBrandsMock.mockResolvedValue([{ name: "Acme", customId: "acme" }])

    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      data: [{ name: "Acme", customId: "acme" }],
    })
  })

  it("maps a rejected adapter to CAT_ERR_001", async () => {
    setEnv()
    fetchBrandsMock.mockRejectedValue(new Error("up"))

    const res = await GET()
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ERR_001,
      message: MSG_CAT_ERR_001,
    })
  })
})
