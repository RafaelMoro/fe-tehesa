import createApolloClient from "./apollo-client";
import { gql } from "@apollo/client";

import type { FetchProductsResponse } from "@/shared/types/global.types";
import { Home } from "@/features/Home/Home";
import { Header } from "@/shared/ui/organisms/Header";

export default async function MainPage() {
  const client = createApolloClient();
  const res = await client.query<FetchProductsResponse>({
    query: gql`
      query GetProductsQuery {
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
      <Header />
      <main className="p-10">
        <h1 className="text-4xl font-bold text-center mb-5">Catalogo de productos</h1>
        <Home products={products} />
      </main>
    </div>
  );
}
