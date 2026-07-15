import { HttpLink } from "@apollo/client"
import { ApolloClient, InMemoryCache } from "@apollo/client"

import { requireStrapiConfig } from "@/shared/utils/strapi-config.utils"

const createApolloClient = () => {
  const { endpoint, token } = requireStrapiConfig()

  return new ApolloClient({
    link: new HttpLink({
      uri: endpoint,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    cache: new InMemoryCache(),
  })
}

export default createApolloClient
