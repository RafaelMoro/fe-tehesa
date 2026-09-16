import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryPage } from "@/features/CategoryPage/CategoryPage"
import { fetchAllProductsByCategory } from "@/shared/lib/global.lib"
import {
  CATEGORY_PAGE_HREFS,
  CATEGORY_PAGES,
  getCategoryIdBySlug,
} from "@/shared/constants/category.constants"
import { CATEGORY_SEO, SITE_URL } from "@/shared/constants/seo.constants"
import { toJsonLdHtml } from "@/shared/utils/seo.utils"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const id = getCategoryIdBySlug(slug)
  if (!id) {
    notFound()
  }

  const { title, description } = CATEGORY_SEO[id]

  return {
    title,
    description,
    alternates: { canonical: `/categorias/${slug}` },
    robots: { index: true, follow: true },
  }
}

export default async function CategoryRoute({ params }: Props) {
  const { slug } = await params
  const id = getCategoryIdBySlug(slug)
  if (!id) {
    notFound()
  }

  const products = await fetchAllProductsByCategory(id)

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
        name: CATEGORY_PAGES[id].name,
        item: `${SITE_URL}${CATEGORY_PAGE_HREFS[id]}`,
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
        <CategoryPage products={products} config={CATEGORY_PAGES[id]} />
      </main>
    </>
  )
}
