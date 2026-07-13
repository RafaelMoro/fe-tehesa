import {
  failure,
  readValidatedParams,
  success,
  validateCatalogEnv,
} from "@/app/api/catalog/_utils"
import {
  fetchCategories,
  fetchProductsByCategory,
} from "@/shared/lib/global.lib"
import {
  CAT_ERR_001,
  CAT_NF_001,
  MSG_CAT_ERR_001,
  MSG_CAT_NF_001,
} from "@/shared/constants/catalog.constants"

export async function GET(request: Request) {
  const envError = validateCatalogEnv()
  if (envError) {
    return failure(envError.code, envError.message)
  }

  const { categoryName, wideSearchPage, productPageSize } =
    readValidatedParams(request)
  if (!categoryName.ok) {
    return failure(categoryName.error.code, categoryName.error.message)
  }
  if (!wideSearchPage.ok) {
    return failure(wideSearchPage.error.code, wideSearchPage.error.message)
  }
  if (!productPageSize.ok) {
    return failure(productPageSize.error.code, productPageSize.error.message)
  }

  try {
    const categories = await fetchCategories()
    if (
      !categories.some((category) => category.name.includes(categoryName.value))
    ) {
      return failure(CAT_NF_001, MSG_CAT_NF_001)
    }
    const products = await fetchProductsByCategory(
      categoryName.value,
      wideSearchPage.value,
    )
    return success(products)
  } catch (error) {
    console.error("GET /api/catalog/category failed", error)
    return failure(CAT_ERR_001, MSG_CAT_ERR_001)
  }
}
