import {PlayerEntity} from '../base/entities/playerEntity';
import {Game} from '../base/game';
import {Action} from '../base/types';
import {Socket} from '../socket';
import {ServerGame} from './serverGame';

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
          x: parseInt((Math.random() * 500).toFixed()),
          y: parseInt((Math.random() * 500).toFixed()),
          id: client.id,
          color: '#' + (((1 << 24) * Math.random()) | 0).toString(16),
          shootEveryTick: 4,
          shotSpeedPerSecond: 500,
          bufferedActions: [],
          shotStrength: 2,
          speedPerSecond: 100,
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
    }, Game.tickRate);
  }

  lastTick = +new Date();
}
