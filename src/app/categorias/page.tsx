import type { Metadata } from "next"

import { CategoriesPage } from "@/features/CategoriesPage/CategoriesPage"
import { fetchCategories, fetchCategoryProductCounts } from "@/shared/lib/global.lib"
import {
  CATEGORIES_DESCRIPTION,
  CATEGORIES_TITLE,
  SITE_URL,
} from "@/shared/constants/seo.constants"
import { toJsonLdHtml } from "@/shared/utils/seo.utils"
import type { CategoryWithCount } from "@/shared/types/global.types"

export const generateMetadata = (): Metadata => ({
  title: CATEGORIES_TITLE,
  description: CATEGORIES_DESCRIPTION,
  alternates: { canonical: "/categorias" },
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
  ],
}

export default async function CategoriesRoute() {
  const categories = await fetchCategories()

  let counts: number[] | null = null
  try {
    counts = await fetchCategoryProductCounts(categories.map((c) => c.customId))
  } catch (error) {
    console.warn(
      "categorias: failed to fetch product counts, rendering cards without the pill",
      error,
    )
  }

  const items: CategoryWithCount[] = categories
    .map((category, i) => ({
      ...category,
      productCount: counts?.[i] ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbJsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">
        <CategoriesPage categories={items} />
      </main>
    </>
  )
}
