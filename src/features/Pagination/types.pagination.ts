import type {
  CatalogMode,
  InitialCatalogFeedback,
  Product,
} from "@/shared/types/global.types"

export type MainPageSearchParams = {
  page?: string
  mode?: string
  q?: string
  category?: string
  brand?: string
  notice?: string
}

export type CatalogSelection = {
  mode: CatalogMode
  value: string | null
  page: number
  fetchProducts: () => Promise<Product[]>
  hasPrevious: boolean
  feedback: InitialCatalogFeedback
}
