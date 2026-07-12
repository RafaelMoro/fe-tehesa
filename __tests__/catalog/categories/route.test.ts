/**
 * @jest-environment node
 */
import { GET } from "@/app/api/catalog/categories/route"
import {
  CAT_ENV_001,
  CAT_ERR_001,
  MSG_CAT_ENV_001,
  MSG_CAT_ERR_001,
} from "@/shared/constants/catalog.constants"

const originalHost = process.env.STRAPI_HOST
const originalToken = process.env.STRAPI_API_TOKEN

const fetchCategoriesMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  fetchCategories: (...args: unknown[]) => fetchCategoriesMock(...args),
}))

afterEach(() => {
  fetchCategoriesMock.mockReset()
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

describe("GET /api/catalog/categories", () => {
  it("returns the taxonomy envelope on success", async () => {
    process.env.STRAPI_HOST = "https://strapi.example/graphql"
    process.env.STRAPI_API_TOKEN = "token"
    fetchCategoriesMock.mockResolvedValue([{ name: "Tubes", customId: "tubes" }])

    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      data: [{ name: "Tubes", customId: "tubes" }],
    })
  })

  it("returns CAT_ENV_001 when env is missing", async () => {
    delete process.env.STRAPI_HOST
    delete process.env.STRAPI_API_TOKEN

    const res = await GET()
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ENV_001,
      message: MSG_CAT_ENV_001,
    })
  })

  it("maps a rejected adapter to CAT_ERR_001", async () => {
    process.env.STRAPI_HOST = "https://strapi.example/graphql"
    process.env.STRAPI_API_TOKEN = "token"
    fetchCategoriesMock.mockRejectedValue(new Error("up"))

    const res = await GET()
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ERR_001,
      message: MSG_CAT_ERR_001,
    })
  })
})
