export const CATEGORIES_PRODUCTS = [
  'twist-drill-bits',
  'shockwave-impact-adapter',
  'hex-keys'
] as const

export type Categories = typeof CATEGORIES_PRODUCTS[number]

export const categoriesDict: Record<Categories, string> = {
  'twist-drill-bits': 'Brocas',
  'shockwave-impact-adapter': 'Broquero',
  'hex-keys': 'Llaves hexagonales'
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