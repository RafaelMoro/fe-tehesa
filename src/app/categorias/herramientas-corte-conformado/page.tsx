import type { Metadata } from "next"

import { CategoryPage } from "@/features/CategoryPage/CategoryPage"
import { fetchAllProductsByCategory } from "@/shared/lib/global.lib"
import {
  CATEGORY_PAGE_HREFS,
  CATEGORY_PAGES,
  CORTE_CONFORMADO_CATEGORY_ID,
} from "@/shared/constants/category.constants"
import {
  CORTE_CONFORMADO_DESCRIPTION,
  CORTE_CONFORMADO_TITLE,
  SITE_URL,
} from "@/shared/constants/seo.constants"
import { toJsonLdHtml } from "@/shared/utils/seo.utils"

export const generateMetadata = (): Metadata => ({
  title: CORTE_CONFORMADO_TITLE,
  description: CORTE_CONFORMADO_DESCRIPTION,
  alternates: { canonical: "/categorias/herramientas-corte-conformado" },
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
      name: CATEGORY_PAGES[CORTE_CONFORMADO_CATEGORY_ID].name,
      item: `${SITE_URL}${CATEGORY_PAGE_HREFS[CORTE_CONFORMADO_CATEGORY_ID]}`,
    },
  ],
}

export default async function CorteConformadoRoute() {
  const products = await fetchAllProductsByCategory(
    CORTE_CONFORMADO_CATEGORY_ID,
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbJsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">
        <CategoryPage
          products={products}
          config={CATEGORY_PAGES[CORTE_CONFORMADO_CATEGORY_ID]}
        />
      </main>
    </>
  )
}
