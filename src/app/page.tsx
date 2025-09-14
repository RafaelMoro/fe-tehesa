import createApolloClient from "./apollo-client";
import { gql } from "@apollo/client";

import { TestComp } from "@/components/TestComp";
import type { FetchProductsResponse } from "@/shared/types/global.types";

export default async function Home() {
  const client = createApolloClient();
  const res = await client.query<FetchProductsResponse>({
    query: gql`
      query ExampleQuery {
        products {
          available
          category
          name
          image {
            url
          }
        }
      }
    `,
  });
  const products = res?.data?.products;
  console.log('products', products);
  return (
    <div>
      <TestComp />
    </div>
  );
}
