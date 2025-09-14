import createApolloClient from "./apollo-client";
import { gql } from "@apollo/client";

import type { FetchProductsResponse } from "@/shared/types/global.types";
import { ProductListing } from "@/features/ProductListing/ProductListing";

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
  const products = res?.data?.products ?? [];

  return (
    <div>
      <ProductListing products={products} />
    </div>
  );
}
