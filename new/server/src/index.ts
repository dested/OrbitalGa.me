import {ServerGameManager} from './game/serverGameManager';
import {ServerSocket} from './serverSocket';
console.log('started');
const serverSocket = new ServerSocket();
const serverGame = new ServerGameManager(serverSocket);
serverGame.init();
