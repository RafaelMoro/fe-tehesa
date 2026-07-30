import type { MetadataRoute } from "next"

import { SITE_URL } from "@/shared/constants/seo.constants"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
