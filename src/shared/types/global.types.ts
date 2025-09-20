export const CATEGORIES_PRODUCTS = [
  'twist_drill_bits',
  'shockwave_impact_adapter',
  'hex_keys'
] as const

export type Categories = typeof CATEGORIES_PRODUCTS[number]

export const categoriesDict: Record<Categories, string> = {
  'twist_drill_bits': 'Brocas',
  'shockwave_impact_adapter': 'Broquero',
  'hex_keys': 'Llaves hexagonales'
}

export interface Product {
  available: boolean;
  category: Categories;
  name: string;
  image: {
    url: string;
  }
}

export interface FetchProductsResponse {
  products: Product[];
}