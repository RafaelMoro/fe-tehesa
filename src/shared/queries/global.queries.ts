import { gql } from "@apollo/client"

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
      documentId
    }
  }
`

export const GET_PRODUCT_VARIANTS = gql`
  query Product($documentId: ID!, $pagination: PaginationArg) {
    product(documentId: $documentId) {
      product_variants(pagination: $pagination) {
        diameter
        pricing {
          price
        }
      }
    }
  }
`

export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory($filters: ProductFiltersInput, $pagination: PaginationArg) {
  products(filters: $filters, pagination: $pagination) {
    maxPrice
    minPrice
    name
    documentId
    variantCount
    brand {
      name
    }
    category {
      name
    }
  }
}
`