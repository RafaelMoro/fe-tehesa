"use client"

import { CategoryPageError } from "@/features/CategoryPage/CategoryPageError"
import {
  ABRASIVOS_CATEGORY_ID,
  CATEGORY_PAGES,
} from "@/shared/constants/category.constants"

export default function Error({ reset }: { reset: () => void }) {
  return (
    <CategoryPageError
      categoryName={CATEGORY_PAGES[ABRASIVOS_CATEGORY_ID].name}
      reset={reset}
    />
  )
}
