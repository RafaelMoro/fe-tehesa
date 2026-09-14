/**
 * @jest-environment node
 */
import { GET } from "@/app/api/catalog/revalidate/route"
import {
  CAT_ENV_001,
  CAT_ERR_001,
  CAT_VAL_007,
  MSG_CAT_ENV_001,
  MSG_CAT_ERR_001,
  MSG_CAT_VAL_007_COUNT,
  MSG_CAT_VAL_007_EMPTY,
  MSG_CAT_VAL_007_PATTERN,
  REVALIDATE_MAX_IDS,
} from "@/shared/constants/catalog.constants"

const originalHost = process.env.STRAPI_HOST
const originalToken = process.env.STRAPI_API_TOKEN

const setEnv = () => {
  process.env.STRAPI_HOST = "https://strapi.example/graphql"
  process.env.STRAPI_API_TOKEN = "token"
}

const fetchVariantsByIdsMock = jest.fn()
const fetchProductsByIdsMock = jest.fn()

jest.mock("@/shared/lib/global.lib", () => ({
  fetchVariantsByIds: (...args: unknown[]) =>
    fetchVariantsByIdsMock(...args),
  fetchProductsByIds: (...args: unknown[]) =>
    fetchProductsByIdsMock(...args),
}))

afterEach(() => {
  fetchVariantsByIdsMock.mockReset()
  fetchProductsByIdsMock.mockReset()
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
  new Request(`http://localhost/api/catalog/revalidate${query}`)

describe("GET /api/catalog/revalidate", () => {
  it("rejects with CAT_ENV_001 when Strapi env is missing", async () => {
    delete process.env.STRAPI_HOST
    delete process.env.STRAPI_API_TOKEN

    const res = await GET(requestWith(""))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ENV_001,
      message: MSG_CAT_ENV_001,
    })
    expect(fetchVariantsByIdsMock).not.toHaveBeenCalled()
  })

  it("issues no query and returns empty arrays when no params are given", async () => {
    setEnv()
    fetchVariantsByIdsMock.mockResolvedValue([])
    fetchProductsByIdsMock.mockResolvedValue([])

    const res = await GET(requestWith(""))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      data: { variants: [], products: [] },
    })
    expect(fetchVariantsByIdsMock).toHaveBeenCalledWith([])
    expect(fetchProductsByIdsMock).toHaveBeenCalledWith([])
  })

  it("forwards variantIds and productIds verbatim to the adapters", async () => {
    setEnv()
    const variants = [{ documentId: "v1", diameter: '15"', pricing: null }]
    const products = [{ documentId: "p1", name: "Tire" }]
    fetchVariantsByIdsMock.mockResolvedValue(variants)
    fetchProductsByIdsMock.mockResolvedValue(products)

    const res = await GET(requestWith("?variantIds=v1,v2&productIds=p1"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      data: { variants, products },
    })
    expect(fetchVariantsByIdsMock).toHaveBeenCalledWith(["v1", "v2"])
    expect(fetchProductsByIdsMock).toHaveBeenCalledWith(["p1"])
  })

  it("rejects an unsafe variantIds character with CAT_VAL_007", async () => {
    setEnv()

    const res = await GET(requestWith("?variantIds=bad!id"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_007,
      message: MSG_CAT_VAL_007_PATTERN,
    })
    expect(fetchVariantsByIdsMock).not.toHaveBeenCalled()
  })

  it("rejects an empty segment in variantIds with CAT_VAL_007", async () => {
    setEnv()

    const res = await GET(requestWith("?variantIds=a,,b"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_007,
      message: MSG_CAT_VAL_007_EMPTY,
    })
  })

  it("rejects a trailing comma in variantIds with CAT_VAL_007", async () => {
    setEnv()

    const res = await GET(requestWith("?variantIds=a,"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_007,
      message: MSG_CAT_VAL_007_EMPTY,
    })
  })

  it("rejects a productIds list over REVALIDATE_MAX_IDS with the count message", async () => {
    setEnv()
    const ids = Array.from(
      { length: REVALIDATE_MAX_IDS + 1 },
      (_, index) => `id${index}`,
    ).join(",")

    const res = await GET(requestWith(`?productIds=${ids}`))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_007,
      message: MSG_CAT_VAL_007_COUNT(REVALIDATE_MAX_IDS, REVALIDATE_MAX_IDS + 1),
    })
  })

  it("validates productIds even when variantIds is valid", async () => {
    setEnv()

    const res = await GET(requestWith("?variantIds=v1&productIds=bad!id"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_VAL_007,
      message: MSG_CAT_VAL_007_PATTERN,
    })
    expect(fetchVariantsByIdsMock).not.toHaveBeenCalled()
  })

  it("maps a rejected adapter call to CAT_ERR_001", async () => {
    setEnv()
    fetchVariantsByIdsMock.mockRejectedValue(new Error("up"))
    fetchProductsByIdsMock.mockResolvedValue([])

    const res = await GET(requestWith("?variantIds=v1"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      code: CAT_ERR_001,
      message: MSG_CAT_ERR_001,
    })
  })
})
