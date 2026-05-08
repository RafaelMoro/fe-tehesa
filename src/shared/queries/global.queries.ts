import { gql } from "@apollo/client"

export const GET_PRODUCTS = gql`
  query GetProductsQuery {
    products {
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

export const GET_PRODUCT = gql`
  query Product($documentId: ID!) {
    product(documentId: $documentId) {
      name
      category {
        name
      }
      brand {
        name
      }
      product_variants {
        diameter
        pricing {
          price
        }
      }
    }
  }
`