import {
  failure,
  readValidatedParams,
  success,
  validateCatalogEnv,
} from "@/app/api/catalog/_utils"
import {
  fetchProductsByIds,
  fetchVariantsByIds,
} from "@/shared/lib/global.lib"
import {
  CAT_ERR_001,
  MSG_CAT_ERR_001,
} from "@/shared/constants/catalog.constants"

export async function GET(request: Request) {
  const envError = validateCatalogEnv()
  if (envError) {
    return failure(envError.code, envError.message)
  }

  const { variantIds, productIds } = readValidatedParams(request)
  if (!variantIds.ok) {
    return failure(variantIds.error.code, variantIds.error.message)
  }
  if (!productIds.ok) {
    return failure(productIds.error.code, productIds.error.message)
  }

  try {
    const [variants, products] = await Promise.all([
      fetchVariantsByIds(variantIds.value),
      fetchProductsByIds(productIds.value),
    ])
    return success({
      variants,
      products,
    })
  } catch (error) {
    console.error("GET /api/catalog/revalidate failed", error)
    return failure(CAT_ERR_001, MSG_CAT_ERR_001)
  }
}
