"use server"
import { cookies } from 'next/headers'
import createApolloClient from "@/app/apollo-client"

import type { FetchProductsResponse, FetchSingleProductResponse, Product, ProductVariant } from '../types/global.types'
import { THEME_COOKIE_KEY } from '../constants/global.constants'
import { GET_PRODUCT_VARIANTS, GET_PRODUCTS } from '../queries/global.queries'

export const fetchProducts = async (): Promise<Product[]> => {
  const client = createApolloClient();
  const res = await client.query<FetchProductsResponse>({
    query: GET_PRODUCTS,
  });
  return res?.data?.products ?? [];
}

export const fetchProductVariants = async ({ documentId }: { documentId: string }): Promise<ProductVariant[]> => {
  const client = createApolloClient();
  const res = await client.query<FetchSingleProductResponse>({
    query: GET_PRODUCT_VARIANTS,
    variables: { documentId },
  });
  return res?.data?.product?.product_variants ?? [];
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
