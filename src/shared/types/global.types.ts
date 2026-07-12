export type AppTheme = 'light' | 'dark'

export type ErrorCatched = {
  message: string;
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

export type TaxonomyItem = {
  name: string;
  customId: string;
};

export interface FetchCategoriesResponse {
  categories: TaxonomyItem[];
}

export interface FetchBrandsResponse {
  brands: TaxonomyItem[];
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
