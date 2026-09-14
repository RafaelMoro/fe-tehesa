import type { MetadataRoute } from "next"

import { fetchBrands, fetchCategories } from "@/shared/lib/global.lib"
import {
  PRODUCT_PAGE_MAX,
  PRODUCT_PAGE_MIN,
} from "@/shared/constants/catalog.constants"
import { SITE_URL } from "@/shared/constants/seo.constants"
import {
  buildBasePagePath,
  buildModeUrl,
} from "@/features/Pagination/utils.pagination"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const basePages: MetadataRoute.Sitemap = []
  for (let page = PRODUCT_PAGE_MIN; page <= PRODUCT_PAGE_MAX; page += 1) {
    basePages.push({
      url: `${SITE_URL}${buildBasePagePath(page)}`,
    })
  }

  try {
    // ponytail: sitemap must not fail a build; degrade to base pages.
    const [categories, brands] = await Promise.all([
      fetchCategories(),
      fetchBrands(),
    ])
    const categoryPages = categories.map((category) => ({
      url: `${SITE_URL}${buildModeUrl("category", category.name, PRODUCT_PAGE_MIN)}`,
    }))
    const brandPages = brands.map((brand) => ({
      url: `${SITE_URL}${buildModeUrl("brand", brand.name, PRODUCT_PAGE_MIN)}`,
    }))
    return [...basePages, ...categoryPages, ...brandPages]
  } catch (error) {
    console.warn(
      "sitemap: failed to fetch category/brand taxonomy, falling back to base pages only",
      error,
    )
    return basePages
  }
}
