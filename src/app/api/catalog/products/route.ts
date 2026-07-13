import {
  failure,
  readValidatedParams,
  success,
  validateCatalogEnv,
} from "@/app/api/catalog/_utils"
import { fetchProducts } from "@/shared/lib/global.lib"
import {
  CAT_ERR_001,
  MSG_CAT_ERR_001,
} from "@/shared/constants/catalog.constants"

export async function GET(request: Request) {
  const envError = validateCatalogEnv()
  if (envError) {
    return failure(envError.code, envError.message)
  }

  const { page, productPageSize } = readValidatedParams(request)
  if (!page.ok) {
    return failure(page.error.code, page.error.message)
  }
  if (!productPageSize.ok) {
    return failure(productPageSize.error.code, productPageSize.error.message)
  }

  try {
    const products = await fetchProducts(page.value)
    return success(products)
  } catch (error) {
    console.error("GET /api/catalog/products failed", error)
    return failure(CAT_ERR_001, MSG_CAT_ERR_001)
  }
}
