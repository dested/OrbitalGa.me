import {ServerGame} from './game/serverGame';
import {ServerSocket} from './serverSocket';
console.log('started');
const serverSocket = new ServerSocket();
const serverGame = new ServerGame(serverSocket);
serverGame.init();
