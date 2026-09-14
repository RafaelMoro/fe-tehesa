export type AppTheme = "light" | "dark"

export type CatalogMode = "base" | "name" | "category" | "brand"

export type InitialCatalogFeedback = {
  message: string
  kind: "status" | "error"
} | null

export type ErrorCatched = {
  message: string
  cause?: {
    code: string
  }
}

export type Category = {
  name: string
}
export type Brand = {
  name: string
}

export type Product = {
  name: string
  category: Category | null
  brand: Brand | null
  documentId: string
  minPrice?: number
  maxPrice?: number
  variantCount?: number
  hasOneProductVariant?: boolean
  product_variants?: ProductVariant[]
}

export interface FetchProductsResponse {
  products: Product[]
}
export interface FetchSingleProductResponse {
  product: Product
}

export type TaxonomyItem = {
  name: string
  customId: string
}

export interface FetchCategoriesResponse {
  categories: TaxonomyItem[]
}

export type FetchCategoryProductCountsResponse = Record<
  string,
  { pageInfo: { total: number } }
>

export type CategoryWithCount = TaxonomyItem & { productCount: number | null }

export interface FetchBrandsResponse {
  brands: TaxonomyItem[]
}

export interface PaginationProps {
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
  totalPages: number
}

export type ProductVariant = {
  documentId: string
  internalId?: string
  diameter: string
  pricing: {
    price: number
  }
}

export type RevalidatedVariant = {
  documentId: string
  diameter: string
  pricing: {
    price: number
  } | null
}

export type RevalidatedProduct = {
  documentId: string
  name: string
}

export type RevalidateData = {
  variants: RevalidatedVariant[]
  products: RevalidatedProduct[]
}

export interface FetchVariantsByIdsResponse {
  productVariants: RevalidatedVariant[]
}

export interface FetchProductsByIdsResponse {
  products: RevalidatedProduct[]
}

export type ProductVariantUI = {
  documentId: string
  internalId?: string
  diameter: string
  price: number
  priceFormatted: string
}

export type CartVariantLine = {
  productDocumentId: string
  productName: string
  quantity: number
  variantDocumentId: string
  internalId?: string
  diameter: string
  unitPrice: number
}

export type CartProductLine = {
  productDocumentId: string
  productName: string
  quantity: number
  variantDocumentId: null
  unitPrice: null
}

export type CartLine = CartVariantLine | CartProductLine

export type CartContact = {
  firstName: string
  lastName: string
  email: string
}
