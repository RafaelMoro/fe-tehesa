import type { Metadata } from "next"

import { BrandsPage } from "@/features/BrandsPage/BrandsPage"
import { fetchBrands } from "@/shared/lib/global.lib"
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbJsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">
        <BrandsPage liveBrandIds={live.map((brand) => brand.customId)} />
      </main>
    </>
  )
}
