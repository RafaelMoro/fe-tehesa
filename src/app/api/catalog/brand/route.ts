import {
  failure,
  readValidatedParams,
  success,
  validateCatalogEnv,
} from "@/app/api/catalog/_utils"
import { fetchBrands, fetchProductsByBrand } from "@/shared/lib/global.lib"
import {
  CAT_ERR_001,
  CAT_NF_002,
  MSG_CAT_ERR_001,
  MSG_CAT_NF_002,
} from "@/shared/constants/catalog.constants"

export async function GET(request: Request) {
  const envError = validateCatalogEnv()
  if (envError) {
    return failure(envError.code, envError.message)
  }

  const { brandName, wideSearchPage, productPageSize } =
    readValidatedParams(request)
  if (!brandName.ok) {
    return failure(brandName.error.code, brandName.error.message)
  }
  if (!wideSearchPage.ok) {
    return failure(wideSearchPage.error.code, wideSearchPage.error.message)
  }
  if (!productPageSize.ok) {
    return failure(productPageSize.error.code, productPageSize.error.message)
  }

  try {
    const brands = await fetchBrands()
    if (!brands.some((brand) => brand.name.includes(brandName.value))) {
      return failure(CAT_NF_002, MSG_CAT_NF_002)
    }
    const products = await fetchProductsByBrand(
      brandName.value,
      wideSearchPage.value,
    )
    return success(products)
  } catch (error) {
    console.error("GET /api/catalog/brand failed", error)
    return failure(CAT_ERR_001, MSG_CAT_ERR_001)
  }
}
