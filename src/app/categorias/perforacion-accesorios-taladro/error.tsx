"use client"

import { CategoryPageError } from "@/features/CategoryPage/CategoryPageError"
import {
  CATEGORY_PAGES,
  PERFORACION_CATEGORY_ID,
} from "@/shared/constants/category.constants"

export default function Error({ reset }: { reset: () => void }) {
  return (
    <CategoryPageError
      categoryName={CATEGORY_PAGES[PERFORACION_CATEGORY_ID].name}
      reset={reset}
    />
  )
}
