import { gql, type DocumentNode } from "@apollo/client"

export const GET_PRODUCTS = gql`
  query GetProductsQuery($pagination: PaginationArg) {
    products(pagination: $pagination) {
      brand {
        name
      }
      category {
        name
      }
      name
      maxPrice
      minPrice
      variantCount
      hasOneProductVariant
      documentId
    }
  }
`

export const GET_PRODUCT_VARIANTS = gql`
  query Product($documentId: ID!, $pagination: PaginationArg) {
    product(documentId: $documentId) {
      product_variants(pagination: $pagination) {
        documentId
        internalId
        diameter
        pricing {
          price
        }
      }
    }
  }
`

export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory(
    $filters: ProductFiltersInput
    $pagination: PaginationArg
  ) {
    products(filters: $filters, pagination: $pagination) {
      maxPrice
      minPrice
      name
      documentId
      variantCount
      hasOneProductVariant
      brand {
        name
      }
      category {
        name
      }
    }
  }
`

export const GET_PRODUCTS_BY_BRAND = gql`
  query GetProductsByBrand(
    $filters: ProductFiltersInput
    $pagination: PaginationArg
  ) {
    products(filters: $filters, pagination: $pagination) {
      name
      minPrice
      maxPrice
      documentId
      category {
        name
      }
      brand {
        name
      }
      variantCount
      hasOneProductVariant
    }
  }
`

export const GET_PRODUCTS_BY_NAME = gql`
  query GetProductsByName(
    $filters: ProductFiltersInput
    $pagination: PaginationArg
  ) {
    products(filters: $filters, pagination: $pagination) {
      name
      minPrice
      maxPrice
      documentId
      variantCount
      hasOneProductVariant
      category {
        name
      }
      brand {
        name
      }
    }
  }
`

export const GET_VARIANTS_BY_IDS = gql`
  query GetVariantsByIds(
    $filters: ProductVariantFiltersInput
    $pagination: PaginationArg
  ) {
    productVariants(filters: $filters, pagination: $pagination) {
      documentId
      diameter
      pricing {
        price
      }
    }
  }
`

export const GET_PRODUCTS_BY_IDS = gql`
  query GetProductsByIds(
    $filters: ProductFiltersInput
    $pagination: PaginationArg
  ) {
    products(filters: $filters, pagination: $pagination) {
      documentId
      name
    }
  }
`

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      name
      customId
    }
  }
`

export const buildCategoryProductCountsQuery = (count: number): DocumentNode => {
  const variableDefinitions = Array.from(
    { length: count },
    (_, i) => `$id${i}: String!`,
  ).join(", ")
  const fields = Array.from(
    { length: count },
    (_, i) =>
      `c${i}: products_connection(filters: { category: { customId: { eq: $id${i} } } }, pagination: { pageSize: 1 }) { pageInfo { total } }`,
  ).join("\n    ")

  return gql(`
    query CategoryProductCounts(${variableDefinitions}) {
      ${fields}
    }
  `)
}

export const GET_BRANDS = gql`
  query GetBrands {
    brands {
      customId
      name
    }
  }
`
