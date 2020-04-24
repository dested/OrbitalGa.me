import {ServerGame} from './game/serverGame';
import {ServerSocket} from './utils/serverSocket';
import {ServerSync} from './game/serverSync';
import {SecureConfig, Config} from 'orbitalgame-server-common/build';

console.log('started');
async function main() {
  debugger;
  await SecureConfig.setup();
  await Config.setup();

  const serverSocket = new ServerSocket();
  const serverSync = new ServerSync();
  const serverGame = new ServerGame(serverSocket, serverSync);
  serverGame.init();
}
main()
  .then((e) => console.log(e))
  .catch((e) => console.error(e));
