import {w3cwebsocket} from 'websocket';
(global as any).WebSocket = w3cwebsocket;
import {Utils} from '@common/utils/utils';
import {ClientSocket} from '../../client/src/clientSocket';
import {ClientGame} from '../../client/src/game/clientGame';
import {BotClientGame} from '../../client/src/game/botClientGame';

console.log('started');

async function main() {
  /*  const clientGame = new BotClientGame({
    onDisconnect: () => {},
    onDied: () => {},
  });
  return;*/
  const serverPath = '1';
  for (let i = 0; i < 50; i++) {
    const options = {
      onDisconnect: () => {},
      onOpen: (me: ClientGame) => {
        me.sendMessageToServer({type: 'join'});
      },
      onDied: (me: ClientGame) => {
        me.joinGame();
      },
    };

    new BotClientGame(serverPath, options, new ClientSocket());
    await Utils.timeout(100);
  }
}

main().catch((ex) => console.error(ex));
