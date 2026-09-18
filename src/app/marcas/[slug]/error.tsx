"use client"

import { useParams } from "next/navigation"

import { CategoryPageError } from "@/features/CategoryPage/CategoryPageError"
import {
  getBrandDisplayName,
  getBrandIdBySlug,
} from "@/shared/constants/brand.constants"

export default function Error({ reset }: { reset: () => void }) {
  const { slug } = useParams<{ slug: string }>()
  const id = getBrandIdBySlug(slug)

  return (
    <CategoryPageError
      name={id ? getBrandDisplayName(id)! : "esta marca"}
      body="Ocurrió un problema al consultar los productos de esta marca. Intenta nuevamente en unos segundos."
      backHref="/marcas"
      backLabel="Ver todas las marcas"
      reset={reset}
    />
  )
}
