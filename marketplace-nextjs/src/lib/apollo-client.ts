import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Use proxy in production to avoid CORS issues
const getGraphQLEndpoint = () => {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost'
  ) {
    // In production, use the Next.js rewrite proxy
    return '/api/graphql-proxy';
  }
  // In development, use direct endpoint
  return (
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
    'https://indexer.dev.hyperindex.xyz/1f84b17/v1/graphql'
  );
};

const httpLink = createHttpLink({
  uri: getGraphQLEndpoint(),
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
