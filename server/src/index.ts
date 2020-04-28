import {ServerGame} from './game/serverGame';
import {ServerSocket} from './utils/serverSocket';
import {ServerSync} from './game/serverSync';
import {SecureConfig, Config} from '../../api/server-common';
import {prisma} from './utils/db';

async function main() {
  console.log('Up');
  await SecureConfig.setup();
  await Config.setup();
  console.log('Starting');
  const serverSocket = new ServerSocket();
  const serverSync = new ServerSync();
  const serverGame = new ServerGame(serverSocket, serverSync);
  serverGame.init();
  console.log('Ready');
}
main()
  .then((e) => console.log('Done', e))
  .catch((e) => console.error('ERROR', e));
