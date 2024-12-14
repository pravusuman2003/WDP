import { ApolloClient, InMemoryCache, split, HttpLink, from } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import config from '../config';

const httpLink = new HttpLink({
  uri: `${config.BACKEND_URL}/graphql`,
  credentials: 'include'
});

const wsLink = new GraphQLWsLink(createClient({
  url: `${config.WS_URL}/graphql`,
  connectionParams: () => ({
    authToken: localStorage.getItem('token')
  }),
  options: {
    reconnect: true,
    connectionCallback: (error) => {
      if (error) {
        console.error('WS connection error:', error);
      }
    },
    shouldRetry: () => true,
    retryAttempts: 5
  }
}));

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: from([errorLink, authLink, splitLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client; 