import {
  failure,
  readValidatedParams,
  success,
  validateCatalogEnv,
} from "@/app/api/catalog/_utils"
import { fetchProductsByName } from "@/shared/lib/global.lib"
import { CAT_ERR_001, MSG_CAT_ERR_001 } from "@/shared/constants/catalog.constants"

export async function GET(request: Request) {
  const envError = validateCatalogEnv()
  if (envError) return failure(envError.code, envError.message)

  const { searchTerm } = readValidatedParams(request)
  if (!searchTerm.ok) return failure(searchTerm.error.code, searchTerm.error.message)

  try {
    const products = await fetchProductsByName(searchTerm.value)
    return success(products)
  } catch (error) {
    console.error('GET /api/catalog/search failed', error)
    return failure(CAT_ERR_001, MSG_CAT_ERR_001)
  }
}
