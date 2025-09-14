export type Categories = 'twist-drill-bits' | 'shockwave-impact-adapter' | 'hex-keys'

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