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