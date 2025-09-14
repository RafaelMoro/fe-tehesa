import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client";

const createApolloClient = () => {
  return new ApolloClient({
    link: new HttpLink({ uri: "http://localhost:1337/graphql", headers: {
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    } }),
    cache: new InMemoryCache(),
  });
};

export default createApolloClient;