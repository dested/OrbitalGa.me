import {ClientToServerMessage, ServerToClientMessage} from '../../../common/src/models/messages';
import {unreachable} from '../../../common/src/utils/unreachable';
import {IServerSocket} from '../serverSocket';
import {uuid} from '../../../common/src/utils/uuid';
import {ColorUtils} from '../../../common/src/utils/colorUtils';
import {GameConstants} from '../../../common/src/game/gameConstants';
import {PlayerEntity} from '../../../common/src/game/entities/playerEntity';
import {ServerGame} from './serverGame';

export class ServerGameManager {
  // users: {connectionId: string}[] = [];
  // todo remove game entities as the source of truth for socket connectoins
  game: ServerGame;

  constructor(private serverSocket: IServerSocket) {
    this.game = new ServerGame(this);

    serverSocket.start(
      connectionId => {
        const newPlayer = new PlayerEntity(this.game, {
          type: 'player',
          x: parseInt((Math.random() * 400).toFixed()) + 50,
          y: parseInt((Math.random() * 400).toFixed()) + 50,
          id: connectionId,
          color: '#' + (((1 << 24) * Math.random()) | 0).toString(16),
          shootEveryTick: 3,
          shotSpeedPerSecond: 800,
          bufferedActions: [],
          shotStrength: 2,
          speedPerSecond: 500,
          isClient: false,
          shipType: Math.random() * 1000 < 500 ? 'ship1' : 'ship2',
        });
        this.game.entities.push(newPlayer);
        this.sendMessageToClient(connectionId, {
          messageType: 'start',
          yourEntityId: connectionId,
          serverTick: this.game.serverTick,
          state: this.game.getWorldState(true),
        });

        for (const player of this.game.playerEntities) {
          if (player !== newPlayer) {
            this.sendMessageToClient(player.id, {messageType: 'worldState', state: this.game.getWorldState(true)});
          }
        }
      },
      connectionId => {
        this.clientLeave(connectionId);
      },
      (connectionId, message) => {
        this.processMessage(connectionId, message);
      }
    );
  }

  init() {
    let serverTick = 0;
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
        this.serverTick(++serverTick, duration, tickTime);
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
    const client = this.game.entities.find(c => c.id === connectionId);
    if (!client) {
      return;
    }
    this.game.entities.splice(this.game.entities.indexOf(client), 1);
  }

  /*
  clientJoin(connectionId: string) {
    this.game.entities.push({connectionId});
    this.sendMessageToClient(connectionId, {type: 'joined'});
  }
*/

  serverTick(tickIndex: number, duration: number, tickTime: number) {
    console.log(
      `tick: ${tickIndex}, Teams: ${this.game.entities.length}, Messages:${this.queuedMessages.length}, Duration: ${tickTime}`
    );
    this.game.lockTick();
    /*
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
      switch (q.message.type) {
        case 'join':
          this.clientJoin(q.connectionId);
          break;
        case 'join2':
          this.clientJoin(q.connectionId);
          break;
        default:
          unreachable(q.message);
      }
    }
    if (!stopped) {
      this.queuedMessages.length = 0;
    } else {
      console.log(this.queuedMessages.length, 'remaining');
    }*/

    /* for (const c of this.users) {
      const messages: ServerToClientMessage[] = [];
      for (const q of this.queuedMessagesToSend) {
        if (q.connectionId === null || q.connectionId === c.connectionId) {
          messages.push(q.message);
        }
      }
      if (messages.length > 0) {
        this.serverSocket.sendMessage(c.connectionId, messages);
      }
    }*/
    for (const c of this.game.entities) {
      for (const q of this.queuedMessagesToSend) {
        if (q.connectionId === null || q.connectionId === c.id) {
          this.serverSocket.sendMessage(c.id, q.message);
        }
      }
    }
    this.queuedMessagesToSend.length = 0;
  }

  queuedMessages: {connectionId: string; message: ClientToServerMessage}[] = [];
  queuedMessagesToSend: {connectionId: string | null; message: ServerToClientMessage}[] = [];

  sendMessageToClient(connectionId: string, message: any /*ServerToClientMessage*/) {
    this.queuedMessagesToSend.push({connectionId, message});
  }
  sendMessageToClients(message: ServerToClientMessage) {
    this.queuedMessagesToSend.push({connectionId: null, message});
  }

  processMessage(connectionId: string, message: any /*ClientToServerMessage*/) {
    if (message.messageType === 'action') {
      this.game.unprocessedActions.push(message.action);
    }

    // this.queuedMessages.push({connectionId, message});
  }
}
