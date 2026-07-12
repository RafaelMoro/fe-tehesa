import {
  failure,
  readValidatedParams,
  success,
  validateCatalogEnv,
} from "@/app/api/catalog/_utils"
import { fetchProductVariants } from "@/shared/lib/global.lib"
import {
  CAT_ERR_001,
  MSG_CAT_ERR_001,
} from "@/shared/constants/catalog.constants"

export async function GET(request: Request) {
  const envError = validateCatalogEnv()
  if (envError) {
    return failure(envError.code, envError.message)
  }

  const { documentId, variantPageSize } = readValidatedParams(request)
  if (!documentId.ok) {
    return failure(documentId.error.code, documentId.error.message)
  }
  if (!variantPageSize.ok) {
    return failure(variantPageSize.error.code, variantPageSize.error.message)
  }

  try {
    const variants = await fetchProductVariants({
      documentId: documentId.value,
    })
    return success(variants)
  } catch (error) {
    console.error("GET /api/catalog/variants failed", error)
    return failure(CAT_ERR_001, MSG_CAT_ERR_001)
  }
}
