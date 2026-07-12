"use server"
import { cookies } from "next/headers"
import createApolloClient from "@/app/apollo-client"

import type {
  FetchBrandsResponse,
  FetchCategoriesResponse,
  FetchProductsResponse,
  FetchSingleProductResponse,
  Product,
  ProductVariant,
  TaxonomyItem,
} from "../types/global.types"
import { THEME_COOKIE_KEY } from "../constants/global.constants"
import {
  GET_BRANDS,
  GET_CATEGORIES,
  GET_PRODUCT_VARIANTS,
  GET_PRODUCTS,
  GET_PRODUCTS_BY_BRAND,
  GET_PRODUCTS_BY_CATEGORY,
  GET_PRODUCTS_BY_NAME,
} from "../queries/global.queries"

/**
 * Adapter error-handling contract — applies to every Apollo-backed helper below
 * (`fetchProducts`, `fetchProductsByCategory`, `fetchProductsByBrand`,
 * `fetchProductsByName`, `fetchProductVariants`, `fetchCategories`, `fetchBrands`).
 *
 * None of them wraps the Apollo call in a local try/catch. The reason is the
 * "throw at the boundary, catch at the edge" pattern: every catalog route handler
 * under `src/app/api/catalog/.../route.ts` already owns the single try/catch that
 * maps any thrown error to
 *   { success: false, code: CAT_ERR_001, message: MSG_CAT_ERR_001 }
 * with HTTP 400, so the client sees a real failure envelope.
 *
 * If an adapter caught locally it would either:
 *   - swallow the error and return `undefined` (the old `fetchProductsByCategory`
 *     and `fetchProductsByBrand` behaviour), which the route's `?? []` then
 *     turned into a successful empty 200 — so a Strapi outage for
 *     category-/brand-filtered reads silently looked like "no products match",
 *     and `fetchProductsByCategory`/`fetchProductsByBrand` had to be given
 *     explicit `Promise<Product[]>` return types and lose their local
 *     catch-and-log branches; OR
 *   - duplicate the error mapping, leaving every adapter free to invent a
 *     slightly different failure shape.
 *
 * Story 3 (data and API boundary coverage) normalised every adapter on the
 * "throw at the boundary, catch at the edge" contract, so rejections from
 * Apollo or the network now propagate consistently and become `CAT_ERR_001` at
 * the route edge.
 *
 * The `?? []` on `res?.data?.<field>` is still intentional on every adapter:
 * a successful GraphQL response with a missing/null collection field is a
 * legitimate empty result, not a failure.
 *
 * If a future adapter needs a different failure shape, change the route's
 * edge handler — do not reintroduce a local try/catch here.
 */

export const fetchProducts = async (page: number = 1): Promise<Product[]> => {
  // ponytail: see the JSDoc above — no local try/catch by contract
  const client = createApolloClient()
  const res = await client.query<FetchProductsResponse>({
    query: GET_PRODUCTS,
    variables: {
      pagination: {
        page,
        pageSize: 50,
      },
    },
  })
  const products = res?.data?.products ?? []
  return products
}

export const fetchProductsByCategory = async (
  customId: string,
  page: number,
): Promise<Product[]> => {
  // ponytail: see the JSDoc above — no local try/catch by contract (was previously
  // swallowed to undefined and turned into [] by the route's `?? []`; Story 3
  // removed the local catch and the `?? []` so rejections reach CAT_ERR_001)
  const client = createApolloClient()
  const res = await client.query<FetchProductsResponse>({
    query: GET_PRODUCTS_BY_CATEGORY,
    variables: {
      filters: {
        category: {
          customId: {
            contains: customId,
          },
        },
      },
      pagination: {
        page,
        pageSize: 50,
      },
    },
  })
  return res?.data?.products ?? []
}

export const fetchProductsByBrand = async (
  brandId: string,
  page: number,
): Promise<Product[]> => {
  // ponytail: see the JSDoc above — no local try/catch by contract (was previously
  // swallowed to undefined and turned into [] by the route's `?? []`; Story 3
  // removed the local catch and the `?? []` so rejections reach CAT_ERR_001)
  const client = createApolloClient()
  const res = await client.query<FetchProductsResponse>({
    query: GET_PRODUCTS_BY_BRAND,
    variables: {
      filters: {
        brand: {
          customId: {
            contains: brandId,
          },
        },
      },
      pagination: {
        page,
        pageSize: 50,
      },
    },
  })
  return res?.data?.products ?? []
}

export const fetchProductsByName = async (
  searchTerm: string,
  page: number,
): Promise<Product[]> => {
  const client = createApolloClient()
  const res = await client.query<FetchProductsResponse>({
    query: GET_PRODUCTS_BY_NAME,
    variables: {
      filters: {
        name: {
          contains: searchTerm,
        },
      },
      pagination: {
        page,
        pageSize: 50,
      },
    },
  })
  return res?.data?.products ?? []
}

export const fetchProductVariants = async ({
  documentId,
}: {
  documentId: string
}): Promise<ProductVariant[]> => {
  const client = createApolloClient()
  const res = await client.query<FetchSingleProductResponse>({
    query: GET_PRODUCT_VARIANTS,
    variables: {
      documentId,
      pagination: {
        page: 1,
        pageSize: 100,
      },
    },
  })
  return res?.data?.product?.product_variants ?? []
}

export const fetchCategories = async (): Promise<TaxonomyItem[]> => {
  const client = createApolloClient()
  const res = await client.query<FetchCategoriesResponse>({
    query: GET_CATEGORIES,
  })
  return res?.data?.categories ?? []
}

export const fetchBrands = async (): Promise<TaxonomyItem[]> => {
  const client = createApolloClient()
  const res = await client.query<FetchBrandsResponse>({
    query: GET_BRANDS,
  })
  return res?.data?.brands ?? []
}

export const getThemePreference = async () => {
  const cookieStore = await cookies()
  const theme = cookieStore.get(THEME_COOKIE_KEY)?.value
  if (!theme) {
    // Return default
    return "light"
  }
  return theme
}

export const saveThemeCookie = async (theme: string): Promise<void> => {
  const cookieStore = await cookies()
  cookieStore.set(THEME_COOKIE_KEY, theme, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  })
}
