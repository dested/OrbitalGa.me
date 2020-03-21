import {ClientToServerMessage, ServerToClientMessage} from '../../../common/src/models/messages';
import {unreachable} from '../../../common/src/utils/unreachable';
import {IServerSocket} from '../serverSocket';
import {uuid} from '../../../common/src/utils/uuid';
import {ColorUtils} from '../../../common/src/utils/colorUtils';
import {GameConstants} from '../../../common/src/game/gameConstants';
import {PlayerEntity} from '../../../common/src/game/entities/playerEntity';
import {EnemyEntity} from '../../../common/src/game/entities/enemyEntity';
import {Utils} from '../../../common/src/utils/utils';
import {Game} from '../../../common/src/game/game';
import {WorldState} from '../../../common/src/game/types';

export class ServerGame extends Game {
  users: {connectionId: string; player?: PlayerEntity}[] = [];

  constructor(private serverSocket: IServerSocket) {
    super();

    serverSocket.start(
      connectionId => {
        this.users.push({connectionId});
      },
      connectionId => {
        this.clientLeave(connectionId);
      },
      (connectionId, message) => {
        this.processMessage(connectionId, message);
      }
    );
  }

  tickIndex: number = 0;

  init() {
    this.tickIndex = 0;
    let time = +new Date();
    let tickTime = 0;
    const processTick = () => {
      try {
        const now = +new Date();
        const duration = now - time;
        if (duration > GameConstants.tickRate * 1.2) {
          console.log(duration);
        }
        time = +new Date();
        // console.time('server tick');
        const newTickTime = +new Date();
        this.tickIndex++;
        this.serverTick(duration, tickTime);
        tickTime = +new Date() - newTickTime;
        // console.timeEnd('server tick');
        // console.time('gc');
        // global.gc();
        // console.timeEnd('gc');
        setTimeout(() => {
          processTick();
        }, Math.max(Math.min(GameConstants.tickRate, GameConstants.tickRate - tickTime), 1));
      } catch (ex) {
        console.error(ex);
      }
    };
    processTick();
  }

  clientLeave(connectionId: string) {
    const client = this.users.find(c => c.connectionId === connectionId);
    if (!client) {
      return;
    }
    if (client.player) {
      client.player.destroy();
    }
    this.users.splice(this.users.indexOf(client), 1);
  }

  /*
  clientJoin(connectionId: string) {
    this.entities.push({connectionId});
    this.sendMessageToClient(connectionId, {type: 'joined'});
  }
*/

  serverTick(duration: number, tickTime: number) {
    console.log(
      `tick: ${this.tickIndex}, Teams: ${this.entities.length}, Messages:${this.queuedMessages.length}, Duration: ${tickTime}`
    );
    const time = +new Date();
    let stopped = false;
    for (let i = 0; i < this.queuedMessages.length; i++) {
      if (time + 500 < +new Date()) {
        console.log('stopped');
        stopped = true;
        this.queuedMessages.splice(0, i);
        break;
      }
      const q = this.queuedMessages[i];

      const message = q.message;
      switch (message.type) {
        case 'action':
          const entity = this.playerEntities.find(a => a.id === message.action.entityId);
          if (entity) {
            // todo validate tick is not more than 1 tick int eh past
            entity.addAction(message.action);
          }
          break;
        case 'join':
          const newPlayer = new PlayerEntity(this, {
            type: 'player',
            x: parseInt((Math.random() * 400).toFixed()) + 50,
            y: parseInt((Math.random() * 400).toFixed()) + 50,
            id: q.connectionId,
            color: '#' + (((1 << 24) * Math.random()) | 0).toString(16),
            shootEveryTick: 3,
            shotSpeedPerSecond: 800,
            bufferedActions: [],
            shotStrength: 2,
            speedPerSecond: 500,
            isClient: false,
            shipType: Math.random() * 1000 < 500 ? 'ship1' : 'ship2',
          });
          this.users.find(a => a.connectionId === q.connectionId).player = newPlayer;
          this.entities.push(newPlayer);
          this.sendMessageToClient(q.connectionId, {
            type: 'start',
            yourEntityId: q.connectionId,
            serverTick: this.tickIndex,
            state: this.getWorldState(true),
          });

          for (const player of this.playerEntities) {
            if (player !== newPlayer) {
              this.sendMessageToClient(player.id, {type: 'worldState', state: this.getWorldState(true)});
            }
          }
          break;

        default:
          unreachable(message);
      }
    }
    if (!stopped) {
      this.queuedMessages.length = 0;
    } else {
      console.log(this.queuedMessages.length, 'remaining');
    }

    if (this.tickIndex % 100 === 1) {
      this.addEntity(
        new EnemyEntity(this, {
          x: parseInt((Math.random() * 400).toFixed()) + 50,
          y: parseInt((Math.random() * 400).toFixed()) + 50,
          color: 'green',
          health: 10,
          type: 'enemy',
          id: Utils.generateId(),
          isClient: false,
        })
      );
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      entity.serverTick(this.tickIndex);
      entity.updatePolygon();
    }
    this.checkCollisions(false);
    for (let i = this.entities.length - 1; i >= 0; i--) {
      if (this.entities[i].willDestroy) {
        this.entities[i].destroy();
      }
    }
    this.sendWorldState();

    for (const c of this.users) {
      const messages: ServerToClientMessage[] = [];
      for (const q of this.queuedMessagesToSend) {
        if (q.connectionId === null || q.connectionId === c.connectionId) {
          messages.push(q.message);
        }
      }
      if (messages.length > 0) {
        this.serverSocket.sendMessage(c.connectionId, messages);
      }
    }
    this.queuedMessagesToSend.length = 0;
  }

  getWorldState(resync: boolean): WorldState {
    if (resync) {
      return {
        entities: this.entities
          .filter(a => a instanceof PlayerEntity || a instanceof EnemyEntity)
          .map(c => c.serialize()),
        serverTick: this.tickIndex,
        resync: true,
      };
    } else {
      return {
        entities: this.entities
          .filter(a => a instanceof PlayerEntity || a instanceof EnemyEntity)
          .map(c => c.serializeLight()),
        serverTick: this.tickIndex,
        resync: false,
      };
    }
  }

  sendWorldState() {
    // let shouldResync = (this.currentTick - this.lastResyncTick) > Server.resyncInterval;
    const worldState = this.getWorldState(true);
    // console.log(worldState);
    for (const client of this.playerEntities) {
      this.sendMessageToClient(client.id, {type: 'worldState', state: worldState});
    }
  }

  queuedMessages: {connectionId: string; message: ClientToServerMessage}[] = [];
  queuedMessagesToSend: {connectionId: string | null; message: ServerToClientMessage}[] = [];

  sendMessageToClient(connectionId: string, message: ServerToClientMessage) {
    this.queuedMessagesToSend.push({connectionId, message});
  }
  sendMessageToClients(message: ServerToClientMessage) {
    this.queuedMessagesToSend.push({connectionId: null, message});
  }

  processMessage(connectionId: string, message: ClientToServerMessage) {
    this.queuedMessages.push({connectionId, message});
  }
}
