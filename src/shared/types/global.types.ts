export type AppTheme = 'light' | 'dark'

export type ErrorCatched = {
  message: string;
  cause?: {
    code: string
  }
}

// TODO: Check if this can be hardcoded
export const CATEGORIES_PRODUCTS = [
  'Extracción y Reparación de fijaciones',
  'Herramientas de corte y conformado',
  'Herramientas de diagnóstico de electricidad y electrónica',
  'Herramientas de impacto o forja',
  'Perforación y accesorios para taladro',
  'Roscado y herramientas para roscas',
  'Tornillería'
] as const

export type CategoriesList = typeof CATEGORIES_PRODUCTS[number]
export type Category = {
  name: string
}
export type Brand = {
  name: string
}

export type Product = {
  name: string;
  category: Category;
  brand: Brand;
  documentId: string;
  minPrice?: number;
  maxPrice?: number;
  variantCount?: number;
}

export interface FetchProductsResponse {
  products: Product[];
}