export type AppTheme = 'light' | 'dark'

export type ErrorCatched = {
  message: string;
  cause?: {
    code: string
  }
}

// TODO: Check if this can be hardcoded
export const CATEGORIES_PRODUCTS = [
  {
    "name": "Herramientas de diagnóstico de electricidad y electrónica",
    "customId": "herramientas-diagnostico-electricidad"
  },
  {
    "name": "Llaves y herramientas de apriete",
    "customId": "llaves-herramientas-apriete"
  },
  {
    "name": "Perforación y accesorios para taladro",
    "customId": "perforacion-accesorios-taladro"
  },
  {
    "name": "Roscado y herramientas para roscas",
    "customId": "roscado-herramientas-roscas"
  },
  {
    "name": "Tornillería",
    "customId": "tornilleria"
  },
  {
    "name": "Extracción y Reparación de fijaciones",
    "customId": "extraccion-reparacion-fijaciones"
  },
  {
    "name": "Herramientas de corte y conformado",
    "customId": "herramientas-corte-conformado"
  },
  {
    "name": "Herramientas de impacto o forja",
    "customId": "herramientas-impacto-forja"
  }
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
  product_variants?: ProductVariant[];
}

export interface FetchProductsResponse {
  products: Product[];
}
export interface FetchSingleProductResponse {
  product: Product;
}

export interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: number;
}

export type ProductVariant = {
  diameter: string;
  pricing: {
    price: number;
  }
}

export type ProductVariantUI = {
  diameter: string;
  price: number;
  priceFormatted: string;
}