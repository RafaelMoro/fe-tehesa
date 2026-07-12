import {
  failure,
  findTaxonomyItem,
  readValidatedParams,
  success,
  validateCatalogEnv,
} from "@/app/api/catalog/_utils"
import { fetchBrands, fetchProductsByBrand } from "@/shared/lib/global.lib"
import { CAT_NF_002, MSG_CAT_NF_002 } from "@/shared/constants/catalog.constants"

export async function GET(request: Request) {
  const envError = validateCatalogEnv()
  if (envError) return failure(envError.code, envError.message)

  const { brandId, wideSearchPage, productPageSize } = readValidatedParams(request)
  if (!brandId.ok) {
    return failure(brandId.error.code, brandId.error.message)
  }
  if (!wideSearchPage.ok) {
    return failure(wideSearchPage.error.code, wideSearchPage.error.message)
  }
  if (!productPageSize.ok) {
    return failure(productPageSize.error.code, productPageSize.error.message)
  }

  try {
    const brands = await fetchBrands()
    if (!findTaxonomyItem(brands, brandId.value)) {
      return failure(CAT_NF_002, MSG_CAT_NF_002)
    }
    const products = (await fetchProductsByBrand(brandId.value, wideSearchPage.value)) ?? []
    return success(products)
  } catch (error) {
    console.error('GET /api/catalog/brand failed', error)
    return failure('CAT_ERR_001', 'Upstream catalog error')
  }
}
