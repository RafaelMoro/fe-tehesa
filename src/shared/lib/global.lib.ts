"use server"
import { cookies } from 'next/headers'
import createApolloClient from "@/app/apollo-client"

import type { FetchBrandsResponse, FetchCategoriesResponse, FetchProductsResponse, FetchSingleProductResponse, Product, ProductVariant, TaxonomyItem } from '../types/global.types'
import { THEME_COOKIE_KEY } from '../constants/global.constants'
import { GET_BRANDS, GET_CATEGORIES, GET_PRODUCT_VARIANTS, GET_PRODUCTS, GET_PRODUCTS_BY_BRAND, GET_PRODUCTS_BY_CATEGORY } from '../queries/global.queries'

export const fetchProducts = async (page: number = 1): Promise<Product[]> => {
  const client = createApolloClient();
  const res = await client.query<FetchProductsResponse>({
    query: GET_PRODUCTS,
    variables: {
      pagination: {
        page,
        pageSize: 50
      }
    }
  });
  const products = res?.data?.products ?? [];
  return products;
}

export const fetchProductsByCategory = async (customId: string) => {
  try {
    const client = createApolloClient();
    const res = await client.query<FetchProductsResponse>({
      query: GET_PRODUCTS_BY_CATEGORY,
      variables: {
        filters: {
          category: {
            customId: {
              contains: customId
            }
          }
        },
        pagination: {
          page: 1,
          pageSize: 50
        }
      }
    });
    const products = res?.data?.products ?? [];
    return products;
  } catch (error) {
    console.log('error fetching products by category', error)
  }
}

export const fetchProductsByBrand = async (brandId: string) => {
  try {
    const client = createApolloClient();
    const res = await client.query<FetchProductsResponse>({
      query: GET_PRODUCTS_BY_BRAND,
      variables: {
        filters: {
          brand: {
            customId: {
              contains: brandId
            }
          }
        },
        pagination: {
          page: 1,
          pageSize: 50
        }
      }
    });
    const products = res?.data?.products ?? [];
    return products;
  } catch (error) {
    console.log('error fetching products by brand', error)
  }
}

export const fetchProductVariants = async ({ documentId }: { documentId: string }): Promise<ProductVariant[]> => {
  const client = createApolloClient();
  const res = await client.query<FetchSingleProductResponse>({
    query: GET_PRODUCT_VARIANTS,
    variables: {
      documentId,
      pagination: {
        page: 1,
        pageSize: 100
      }
    },
  });
  return res?.data?.product?.product_variants ?? [];
}

export const fetchCategories = async (): Promise<TaxonomyItem[]> => {
  const client = createApolloClient();
  const res = await client.query<FetchCategoriesResponse>({
    query: GET_CATEGORIES,
  });
  return res?.data?.categories ?? [];
}

export const fetchBrands = async (): Promise<TaxonomyItem[]> => {
  const client = createApolloClient();
  const res = await client.query<FetchBrandsResponse>({
    query: GET_BRANDS,
  });
  return res?.data?.brands ?? [];
}

export const getThemePreference = async () => {
  const cookieStore = await cookies()
  const theme = cookieStore.get(THEME_COOKIE_KEY)?.value
  if (!theme) {
    // Return default
    return 'light'
  }
  return theme
}

export const saveThemeCookie = async (theme: string): Promise<void> => {
  const cookieStore = await cookies()
  cookieStore.set(THEME_COOKIE_KEY, theme, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  })
}
