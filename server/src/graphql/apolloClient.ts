import fetch from 'node-fetch';
import {createHttpLink} from 'apollo-link-http';
import ApolloClient from 'apollo-boost';

export const apolloClient = new ApolloClient({
  fetch: fetch as any,
  uri: 'http://localhost:3116/graphql',
  request: (operation) => {
    operation.setContext({
      headers: {},
    });
  },
});
