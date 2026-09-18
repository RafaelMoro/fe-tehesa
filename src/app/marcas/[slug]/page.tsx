import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BrandPage } from "@/features/BrandPage/BrandPage"
import { fetchAllProductsByBrand } from "@/shared/lib/global.lib"
import {
  BRAND_PAGE_HREFS,
  BRAND_PAGES,
  getBrandDisplayName,
  getBrandIdBySlug,
} from "@/shared/constants/brand.constants"
import { BRAND_SEO, SITE_URL } from "@/shared/constants/seo.constants"
import { toJsonLdHtml } from "@/shared/utils/seo.utils"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const id = getBrandIdBySlug(slug)
  if (!id) {
    notFound()
  }

  const { title, description } = BRAND_SEO[id]

  return {
    title,
    description,
    alternates: { canonical: `/marcas/${slug}` },
    robots: { index: true, follow: true },
  }
}

export default async function BrandRoute({ params }: Props) {
  const { slug } = await params
  const id = getBrandIdBySlug(slug)
  if (!id) {
    notFound()
  }

  const products = await fetchAllProductsByBrand(id)
  const displayName = getBrandDisplayName(id)!

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
      {
        "@type": "ListItem",
        position: 3,
        name: displayName,
        item: `${SITE_URL}${BRAND_PAGE_HREFS[id]}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbJsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">
        <BrandPage
          products={products}
          displayName={displayName}
          heading={BRAND_SEO[id].heading}
          config={BRAND_PAGES[id]}
        />
      </main>
    </>
  )
}
