"use client";

import { HttpLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

const { STRAPI_HOST, STRAPI_API_TOKEN } = process.env

function makeClient() {
  const httpLink = new HttpLink({
    // Use an absolute URL for SSR
    uri: STRAPI_HOST,
    fetchOptions: {
      // Optional: Next.js-specific fetch options
      // Note: This doesn't work with `export const dynamic = "force-static"`
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
    },
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}