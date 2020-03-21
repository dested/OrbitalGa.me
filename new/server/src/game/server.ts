import {ServerGame} from './serverGame2';
import {PlayerEntity} from '../../../common/src/game/entities/playerEntity';
import {Game} from '../../../common/src/game/game';
import {GameConstants} from '../../../common/src/game/gameConstants';

export class Server {
  game: ServerGame;

  constructor() {
    this.game = new ServerGame();
    Socket.createServer(
      (clientId, message) => {
        if (message.messageType === 'action') {
          this.game.unprocessedActions.push(message.action);
        }
      },
      client => {
        const newPlayer = new PlayerEntity(this.game, {
          type: 'player',
          x: parseInt((Math.random() * 400).toFixed()) + 50,
          y: parseInt((Math.random() * 400).toFixed()) + 50,
          id: client.id,
          color: '#' + (((1 << 24) * Math.random()) | 0).toString(16),
          shootEveryTick: 3,
          shotSpeedPerSecond: 800,
          bufferedActions: [],
          shotStrength: 2,
          speedPerSecond: 250,
          isClient: false,
          shipType: Math.random() * 1000 < 500 ? 'ship1' : 'ship2',
        });
        this.game.entities.push(newPlayer);
        Socket.sendToClient(client.id, {
          messageType: 'start',
          yourEntityId: client.id,
          serverTick: this.game.serverTick,
          state: this.game.getWorldState(true),
        });

        for (const player of this.game.playerEntities) {
          if (player !== newPlayer) {
            Socket.sendToClient(client.id, {messageType: 'worldState', state: this.game.getWorldState(true)});
          }
        }
      }
    );

    setInterval(() => {
      this.game.lockTick();
    }, GameConstants.tickRate);
  }

  lastTick = +new Date();
}
