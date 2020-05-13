import {w3cwebsocket} from 'websocket';
(global as any).WebSocket = w3cwebsocket;
import {OrbitalGame} from '@common/game/game';
import {Utils} from '@common/utils/utils';
import ApolloClient, {InMemoryCache, IntrospectionFragmentMatcher} from 'apollo-boost';
import fetch from 'node-fetch';
import {ClientConfig} from '../../client/src/clientConfig';
import {BotClientEngine} from '../../client/src/game/botClientEngine';
import {
  LoginAnonymousDocument,
  LoginAnonymousMutation,
  LoginAnonymousMutationVariables,
} from '../../client/src/schema/generated/graphql';
import {ClientSocket} from '../../client/src/socket/clientSocket';
import {makeJwt} from '../../client/src/utils/jwt';

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData: {
    __schema: {
      types: [
        {
          kind: 'UNION',
          name: 'LoginSuccessResponseResponse',
          possibleTypes: [
            {
              name: 'LoginSuccessResponse',
            },
            {
              name: 'ErrorResponse',
            },
          ],
        },
      ],
    },
  },
});

const cache = new InMemoryCache({fragmentMatcher});

const apolloClient = new ApolloClient({
  fetch: fetch as any,
  cache,
  uri: ClientConfig.graphqlEndpoint,
  request: (operation) => {
    operation.setContext({
      headers: {},
    });
  },
});

async function main() {
  for (let i = 0; i < 50; i++) {
    const start = async () => {
      const result = await apolloClient.mutate<LoginAnonymousMutation, LoginAnonymousMutationVariables>({
        mutation: LoginAnonymousDocument,
        variables: {userName: Math.random() + ''},
      });
      switch (result.data?.loginAnonymous.__typename) {
        case 'ErrorResponse':
          alert(result.data?.loginAnonymous.error);
          return;
        case 'LoginSuccess': {
          if (result.data?.loginAnonymous.gameModel) {
            new BotClientEngine(
              result.data?.loginAnonymous.gameModel.serverUrl,
              {
                onDisconnect: () => {
                  start();
                },
                onReady: () => {},
                onError: () => {},
                onOpen: (me) => {
                  me.sendMessageToServer({type: 'join'});
                },
                onUIUpdate: () => {},
                onDied: (me) => {
                  me.joinGame();
                },
              },
              new ClientSocket(makeJwt(result.data?.loginAnonymous.jwt)),
              new OrbitalGame(true)
            );
          } else {
            console.log('server down');
          }
          break;
        }
      }
    };
    await start();
    await Utils.timeout(10);
  }
}

main().catch((ex) => console.error(ex));
