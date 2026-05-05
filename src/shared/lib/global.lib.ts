"use server"
import { cookies } from 'next/headers'
import { gql } from "@apollo/client"
import createApolloClient from "@/app/apollo-client"
import type { FetchProductsResponse, Product } from '../types/global.types'
import { THEME_COOKIE_KEY } from '../constants/global.constants'

export const fetchProducts = async (): Promise<Product[]> => {
  const client = createApolloClient();
  const res = await client.query<FetchProductsResponse>({
    query: gql`
      query GetProductsQuery {
        products {
          brand {
            name
          }
          category {
            name
          }
          name
        }
      }
    `,
  });
  return res?.data?.products ?? [];
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
