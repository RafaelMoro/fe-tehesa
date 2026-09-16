import type { Metadata } from "next"

import { CategoryPage } from "@/features/CategoryPage/CategoryPage"
import { fetchAllProductsByCategory } from "@/shared/lib/global.lib"
import {
  CATEGORY_PAGE_HREFS,
  CATEGORY_PAGES,
  IMPACTO_FORJA_CATEGORY_ID,
} from "@/shared/constants/category.constants"
import {
  IMPACTO_FORJA_DESCRIPTION,
  IMPACTO_FORJA_TITLE,
  SITE_URL,
} from "@/shared/constants/seo.constants"
import { toJsonLdHtml } from "@/shared/utils/seo.utils"

export const generateMetadata = (): Metadata => ({
  title: IMPACTO_FORJA_TITLE,
  description: IMPACTO_FORJA_DESCRIPTION,
  alternates: { canonical: "/categorias/impacto-forja" },
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
      name: "Categorías",
      item: `${SITE_URL}/categorias`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: CATEGORY_PAGES[IMPACTO_FORJA_CATEGORY_ID].name,
      item: `${SITE_URL}${CATEGORY_PAGE_HREFS[IMPACTO_FORJA_CATEGORY_ID]}`,
    },
  ],
}

export default async function ImpactoForjaRoute() {
  const products = await fetchAllProductsByCategory(IMPACTO_FORJA_CATEGORY_ID)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbJsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">
        <CategoryPage
          products={products}
          config={CATEGORY_PAGES[IMPACTO_FORJA_CATEGORY_ID]}
        />
      </main>
    </>
  )
}
