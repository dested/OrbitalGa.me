import ApolloClient from 'apollo-boost';
import {ClientConfig} from '../clientConfig';
import {uiStore} from '../store/uiStore';

export const apolloClient = new ApolloClient({
  uri: ClientConfig.graphqlEndpoint,
  request: (operation) => {
    operation.setContext({
      headers: {
        Authorization: uiStore.jwt ? 'Bearer ' + uiStore.jwt : undefined,
      },
    });
  },
});