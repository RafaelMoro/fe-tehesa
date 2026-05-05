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

export interface Product {
  category: CategoriesList;
  name: string;
  image: {
    url: string;
  }
}

export interface FetchProductsResponse {
  products: Product[];
}