import { HttpLink } from "@apollo/client"
import { ApolloClient, InMemoryCache } from "@apollo/client"

const { STRAPI_HOST, STRAPI_API_TOKEN } = process.env

const createApolloClient = () => {
  return new ApolloClient({
    link: new HttpLink({
      uri: STRAPI_HOST,
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    }),
    cache: new InMemoryCache(),
  })
}

export default createApolloClient
