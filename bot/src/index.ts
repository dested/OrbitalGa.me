import {w3cwebsocket} from 'websocket';
(global as any).WebSocket = w3cwebsocket;
import {Utils} from '@common/utils/utils';
import {ClientSocket} from '../../client/src/clientSocket';
import {BotClientGame} from '../../client/src/game/botClientGame';
import {ClientGame} from '../../client/src/game/clientGame';

console.log('started');

async function main() {
  /*  const clientGame = new BotClientGame({
    onDisconnect: () => {},
    onDied: () => {},
  });
  return;*/
  const serverPath = '1';
  for (let i = 0; i < 50; i++) {
    const start = () => {
      new BotClientGame(
        serverPath,
        {
          onDisconnect: () => {
            start();
          },
          onOpen: (me: ClientGame) => {
            me.sendMessageToServer({type: 'join'});
            setTimeout(async () => {
              me.disconnect();
              await Utils.timeout(1000);
            }, 5000 + Math.random() * 10000);
          },
          onUIUpdate: () => {},
          onDied: (me: ClientGame) => {
            me.joinGame();
          },
        },
        new ClientSocket()
      );
    };
    start();
    await Utils.timeout(10);
  }
}

main().catch((ex) => console.error(ex));
