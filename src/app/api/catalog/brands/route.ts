import { failure, success, validateCatalogEnv } from "@/app/api/catalog/_utils"
import { fetchBrands } from "@/shared/lib/global.lib"
import {
  CAT_ERR_001,
  MSG_CAT_ERR_001,
} from "@/shared/constants/catalog.constants"

export async function GET() {
  const envError = validateCatalogEnv()
  if (envError) {
    return failure(envError.code, envError.message)
  }

  try {
    const brands = await fetchBrands()
    return success(brands)
  } catch (error) {
    console.error("GET /api/catalog/brands failed", error)
    return failure(CAT_ERR_001, MSG_CAT_ERR_001)
  }
}
