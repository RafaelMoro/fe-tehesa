import createApolloClient from "./apollo-client";
import { gql } from "@apollo/client";

import { TestComp } from "@/components/TestComp";

export default async function Home() {
  const client = createApolloClient();
  const { data } = await client.query({
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
  console.log('datta', data)
  return (
    <div>
      <TestComp />
    </div>
  );
}
