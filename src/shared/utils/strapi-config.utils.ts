export type StrapiConfig = {
  endpoint: string
  token: string
}

export const getStrapiConfig = (): StrapiConfig | null => {
  const endpoint = process.env.STRAPI_HOST?.trim()
  const token = process.env.STRAPI_API_TOKEN?.trim()

  if (!endpoint || !token) {
    return null
  }

  try {
    const url = new URL(endpoint)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null
    }
  } catch {
    return null
  }

  return { endpoint, token }
}

export const requireStrapiConfig = (): StrapiConfig => {
  const config = getStrapiConfig()

  if (!config) {
    throw new Error(
      "Invalid Strapi configuration: STRAPI_HOST must be an absolute HTTP(S) URL and STRAPI_API_TOKEN must be set.",
    )
  }

  return config
}
