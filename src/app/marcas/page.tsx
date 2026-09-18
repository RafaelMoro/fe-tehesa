import type { Metadata } from "next"

import { BrandsPage } from "@/features/BrandsPage/BrandsPage"
import type { BrandCardItem } from "@/features/BrandsPage/BrandCard"
import { fetchBrands } from "@/shared/lib/global.lib"
import { BRAND_PAGES } from "@/shared/constants/brand.constants"
import {
  BRANDS_DESCRIPTION,
  BRANDS_TITLE,
  SITE_URL,
} from "@/shared/constants/seo.constants"
import { toJsonLdHtml } from "@/shared/utils/seo.utils"

export const generateMetadata = (): Metadata => ({
  title: BRANDS_TITLE,
  description: BRANDS_DESCRIPTION,
  alternates: { canonical: "/marcas" },
  robots: { index: true, follow: true },
})

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Marcas",
      item: `${SITE_URL}/marcas`,
    },
  ],
}

export default async function BrandsRoute() {
  const live = await fetchBrands()
  const liveIds = new Set(live.map((brand) => brand.customId))
  const brands: BrandCardItem[] = Object.entries(BRAND_PAGES)
    .filter(([customId]) => liveIds.has(customId))
    .map(([customId, config]) => ({ customId, ...config }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbJsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">
        <BrandsPage brands={brands} />
      </main>
    </>
  )
}
