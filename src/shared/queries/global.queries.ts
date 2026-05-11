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
  query Product($documentId: ID!) {
    product(documentId: $documentId) {
      product_variants {
        diameter
        pricing {
          price
        }
      }
    }
  }
`