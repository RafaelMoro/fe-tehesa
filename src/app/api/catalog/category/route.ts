import {
  failure,
  findTaxonomyItem,
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

  const { categoryId, wideSearchPage, productPageSize } =
    readValidatedParams(request)
  if (!categoryId.ok) {
    return failure(categoryId.error.code, categoryId.error.message)
  }
  if (!wideSearchPage.ok) {
    return failure(wideSearchPage.error.code, wideSearchPage.error.message)
  }
  if (!productPageSize.ok) {
    return failure(productPageSize.error.code, productPageSize.error.message)
  }

  try {
    const categories = await fetchCategories()
    if (!findTaxonomyItem(categories, categoryId.value)) {
      return failure(CAT_NF_001, MSG_CAT_NF_001)
    }
    const products = await fetchProductsByCategory(
      categoryId.value,
      wideSearchPage.value,
    )
    return success(products)
  } catch (error) {
    console.error("GET /api/catalog/category failed", error)
    return failure(CAT_ERR_001, MSG_CAT_ERR_001)
  }
}
