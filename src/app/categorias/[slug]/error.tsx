"use client"

import { useParams } from "next/navigation"

import { CategoryPageError } from "@/features/CategoryPage/CategoryPageError"
import {
  CATEGORY_PAGES,
  getCategoryIdBySlug,
} from "@/shared/constants/category.constants"

export default function Error({ reset }: { reset: () => void }) {
  const { slug } = useParams<{ slug: string }>()
  const id = getCategoryIdBySlug(slug)

  return (
    <CategoryPageError
      name={id ? CATEGORY_PAGES[id].name : "esta categoría"}
      body="Ocurrió un problema al consultar los productos de esta categoría. Intenta nuevamente en unos segundos."
      backHref="/categorias"
      backLabel="Ver todas las categorías"
      reset={reset}
    />
  )
}
