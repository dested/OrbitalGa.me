import ApolloClient from 'apollo-boost';
import {ClientConfig} from '../clientConfig';
import {uiStore} from '../store/uiStore';
import {IntrospectionFragmentMatcher, InMemoryCache} from 'apollo-cache-inmemory';
import introspectionQueryResultData from './generated/fragmentTypes.json';

const fragmentMatcher = new IntrospectionFragmentMatcher({introspectionQueryResultData});

const cache = new InMemoryCache({fragmentMatcher});

export const apolloClient = new ApolloClient({
  uri: ClientConfig.graphqlEndpoint,
  cache,
  request: (operation) => {
    operation.setContext({
      headers: {
        Authorization: uiStore.jwt ? 'Bearer ' + uiStore.jwt : undefined,
      },
    });
  },
});
