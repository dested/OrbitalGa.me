import {w3cwebsocket} from 'websocket';
(global as any).WebSocket = w3cwebsocket;
import {Utils} from '@common/utils/utils';
import ApolloClient from 'apollo-boost';
import fetch from 'node-fetch';
import {ClientSocket} from '../../client/src/clientSocket';
import {BotClientGame} from '../../client/src/game/botClientGame';
import {ClientGame} from '../../client/src/game/clientGame';
import {
  LoginAnonymousDocument,
  LoginAnonymousMutation,
  LoginAnonymousMutationVariables,
} from '../../client/src/schema/generated/graphql';
import {makeJwt} from '../../client/src/utils/jwt';

console.log('started');

async function main() {
  const apolloClient = new ApolloClient({
    fetch: fetch as any,
    uri: 'http://localhost:3116/graphql',
    request: (operation) => {
      operation.setContext({
        headers: {},
      });
    },
  });

  for (let i = 0; i < 3; i++) {
    const start = async () => {
      const result = await apolloClient.mutate<LoginAnonymousMutation, LoginAnonymousMutationVariables>({
        mutation: LoginAnonymousDocument,
        variables: {userName: Math.random() + ''},
      });
      switch (result.data?.loginAnonymous.__typename) {
        case 'ErrorResponse':
          alert(result.data?.loginAnonymous.error);
          return;
        case 'LoginSuccessResponse': {
          if (result.data?.loginAnonymous.gameModel) {
            new BotClientGame(
              result.data?.loginAnonymous.gameModel.serverUrl,
              {
                onDisconnect: () => {
                  start();
                },
                onReady: () => {},
                onError: () => {},
                onOpen: (me: ClientGame) => {
                  me.sendMessageToServer({type: 'join'});
                },
                onUIUpdate: () => {},
                onDied: (me: ClientGame) => {
                  me.joinGame();
                },
              },
              new ClientSocket(makeJwt(result.data?.loginAnonymous.jwt))
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
