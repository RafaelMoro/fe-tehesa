/**
 * @jest-environment node
 */
import {
  getStrapiConfig,
  requireStrapiConfig,
} from "@/shared/utils/strapi-config.utils"

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

describe("Strapi configuration", () => {
  it("accepts and trims an absolute HTTP endpoint", () => {
    process.env.STRAPI_HOST = " https://strapi.example/graphql "
    process.env.STRAPI_API_TOKEN = " token "

    expect(getStrapiConfig()).toEqual({
      endpoint: "https://strapi.example/graphql",
      token: "token",
    })
  })

  it.each([undefined, "", "/graphql", "ftp://strapi.example/graphql"])(
    "rejects an invalid endpoint: %s",
    (endpoint) => {
      if (endpoint === undefined) {
        delete process.env.STRAPI_HOST
      } else {
        process.env.STRAPI_HOST = endpoint
      }
      process.env.STRAPI_API_TOKEN = "token"

      expect(getStrapiConfig()).toBeNull()
    },
  )

  it("throws a controlled error instead of constructing /graphql", () => {
    delete process.env.STRAPI_HOST
    delete process.env.STRAPI_API_TOKEN

    expect(requireStrapiConfig).toThrow(
      "STRAPI_HOST must be an absolute HTTP(S) URL",
    )
  })
})
