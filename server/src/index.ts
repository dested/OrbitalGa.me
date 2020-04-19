import {ServerGame} from './game/serverGame';
import {ServerSocket} from './serverSocket';
import {ServerSync} from './game/serverSync';

console.log('started');
const serverSocket = new ServerSocket();
const serverSync = new ServerSync();
const serverGame = new ServerGame(serverSocket, serverSync);
serverGame.init();
