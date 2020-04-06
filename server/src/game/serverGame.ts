import {ClientToServerMessage, ServerToClientMessage, WorldStateEntity} from '@common/models/messages';
import {unreachable} from '@common/utils/unreachable';
import {IServerSocket} from '../serverSocket';
import {nextId} from '@common/utils/uuid';
import {GameConstants} from '@common/game/gameConstants';
import {Game} from '@common/game/game';
import {Utils} from '@common/utils/utils';
import {SwoopingEnemyEntity} from '@common/entities/swoopingEnemyEntity';
import {ServerPlayerEntity} from './entities/serverPlayerEntity';
import {Cluster} from '@common/utils/pointCluster';
import {SpectatorEntity} from '@common/entities/spectatorEntity';

export class ServerGame extends Game {
  users: {connectionId: string; entity: ServerPlayerEntity}[] = [];
  spectators: {connectionId: string}[] = [];

  constructor(private serverSocket: IServerSocket) {
    super(false);
    serverSocket.start(
      (connectionId) => {
        this.queuedMessagesToSend[connectionId] = [];
      },
      (connectionId) => {
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

    this.initGame();

    const processTick = () => {
      try {
        const now = +new Date();
        const duration = now - time;
        if (duration > GameConstants.serverTickRate * 1.2) {
          console.log('bad duration', duration);
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

        if (serverTick % 15 === 0) {
          this.updateSpectatorPosition();
        }

        setTimeout(() => {
          processTick();
        }, Math.max(Math.min(GameConstants.serverTickRate, GameConstants.serverTickRate - tickTime), 1));
      } catch (ex) {
        console.error(ex);
      }
    };
    setTimeout(() => {
      processTick();
    }, 1000 / 5);
  }

  clientLeave(connectionId: string) {
    delete this.queuedMessagesToSend[connectionId];
    const user = this.users.find((c) => c.connectionId === connectionId);
    if (!user) {
      return;
    }
    this.users.splice(this.users.indexOf(user), 1);
    this.entities.remove(user.entity);
  }

  clientJoin(connectionId: string) {
    const spectatorIndex = this.spectators.findIndex((a) => a.connectionId === connectionId);
    if (spectatorIndex >= 0) {
      this.spectators.splice(spectatorIndex, 1);
    }

    const entity = new ServerPlayerEntity(this, nextId());

    const {x0, x1} = this.getPlayerRange(200, (e) => e.entityType === 'player');

    entity.x = Utils.randomInRange(x0, x1);
    entity.y = GameConstants.playerStartingY;
    this.users.push({connectionId, entity});
    this.entities.push(entity);
    this.sendMessageToClient(connectionId, {
      type: 'joined',
      entityId: entity.entityId,
      x: entity.x,
      y: entity.y,
      serverVersion: GameConstants.serverVersion,
    });
  }

  spectatorJoin(connectionId: string) {
    this.spectators.push({connectionId});
    this.sendMessageToClient(connectionId, {
      type: 'spectating',
      serverVersion: GameConstants.serverVersion,
    });
  }

  serverTick(tickIndex: number, duration: number, tickTime: number) {
    /*
    console.log(
      `tick: ${tickIndex}, Users: ${this.users.length}, Entities: ${this.entities.length}, Messages:${this.queuedMessages.length}, Duration: ${tickTime}`
    );
*/

    const inputThisTick = Utils.toDictionary(this.users, (a) => a.entity.entityId);

    const time = +new Date();
    let stopped = false;

    for (let i = 0; i < this.queuedMessages.length; i++) {
      if (time + 100 < +new Date()) {
        console.log('stopped');
        stopped = true;
        this.queuedMessages.splice(0, i);
        break;
      }
      const q = this.queuedMessages[i];
      switch (q.message.type) {
        case 'join':
          {
            this.clientJoin(q.connectionId);
          }
          break;
        case 'spectate':
          {
            this.spectatorJoin(q.connectionId);
          }
          break;
        case 'playerInput': {
          const user = this.users.find((a) => a.connectionId === q.connectionId);
          if (user) {
            delete inputThisTick[user.entity.entityId];
            user.entity.applyInput(q.message);
            this.collisionEngine.update();
            user.entity.checkCollisions();
          }

          break;
        }
        default:
          unreachable(q.message);
      }
    }
    for (const key in inputThisTick) {
      inputThisTick[key].entity.applyInput({
        down: false,
        up: false,
        right: false,
        left: false,
        shoot: false,
        inputSequenceNumber: inputThisTick[key].entity.lastProcessedInputSequenceNumber + 1,
      });
    }

    if (!stopped) {
      this.queuedMessages.length = 0;
    } else {
      console.log(this.queuedMessages.length, 'remaining');
    }

    if (tickIndex % 50 < 2) {
      const enemyCount = this.users.length + 1;
      for (let i = 0; i < enemyCount; i++) {
        const {x0, x1} = this.getPlayerRange(200, (entity) => entity.entityType === 'player');

        const swoopingEnemyEntity = new SwoopingEnemyEntity(this, nextId(), 10);
        swoopingEnemyEntity.start(
          Utils.randomInRange(x0, x1),
          -GameConstants.screenSize.height * 0.1 + Math.random() * GameConstants.screenSize.height * 0.15
        );
        swoopingEnemyEntity.setStartPosition(swoopingEnemyEntity.x, swoopingEnemyEntity.y);
        this.entities.push(swoopingEnemyEntity);
      }
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities.getIndex(i);
      entity.gameTick(duration);
    }

    this.checkCollisions();

    this.sendWorldState();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities.getIndex(i);
      if (entity.markToDestroy) {
        this.entities.remove(entity);
      } else {
        entity.postTick();
      }
    }

    for (const c of this.users) {
      const messages = this.queuedMessagesToSend[c.connectionId];
      if (messages && messages.length > 0) {
        this.serverSocket.sendMessage(c.connectionId, messages);
        messages.length = 0;
      }
    }
    for (const c of this.spectators) {
      const messages = this.queuedMessagesToSend[c.connectionId];
      if (messages && messages.length > 0) {
        this.serverSocket.sendMessage(c.connectionId, messages);
        messages.length = 0;
      }
    }

    this.sendSpectatorWorldState();
  }

  queuedMessages: {connectionId: string; message: ClientToServerMessage}[] = [];
  queuedMessagesToSend: {[connectionId: string]: ServerToClientMessage[]} = {};

  sendMessageToClient(connectionId: string, message: ServerToClientMessage) {
    this.queuedMessagesToSend[connectionId].push(message);
  }

  processMessage(connectionId: string, message: ClientToServerMessage) {
    this.queuedMessages.push({connectionId, message});
  }

  private sendWorldState() {
    const entities = this.entities.map((entity) => entity.serialize() as WorldStateEntity);

    for (const user of this.users) {
      if (!user.entity) {
        continue;
      }
      const box = {
        x0: user.entity.realX - GameConstants.screenRange / 2,
        x1: user.entity.realX + GameConstants.screenRange / 2,
      };

      const myEntities = [...entities];
      for (let i = myEntities.length - 1; i >= 0; i--) {
        const myEntity = myEntities[i];
        const x = myEntity.realX ?? myEntity.x;
        if (x < box.x0 || x > box.x1) {
          myEntities.splice(i, 1);
        }
      }

      this.sendMessageToClient(user.connectionId, {
        type: 'worldState',
        entities: myEntities,
      });
    }
  }

  private sendSpectatorWorldState() {
    const spectator = this.entities.array.find((a) => a instanceof SpectatorEntity);
    if (!spectator) {
      return;
    }
    const box = {
      x0: spectator.x - GameConstants.screenRange / 2,
      x1: spectator.x + GameConstants.screenRange / 2,
    };

    const myEntities = this.entities.map((entity) => entity.serialize() as WorldStateEntity);
    for (let i = myEntities.length - 1; i >= 0; i--) {
      const myEntity = myEntities[i];
      const x = myEntity.realX ?? myEntity.x;
      if (x < box.x0 || x > box.x1) {
        myEntities.splice(i, 1);
      }
    }

    for (const c of this.spectators) {
      this.serverSocket.sendMessage(c.connectionId, [
        {
          type: 'worldState',
          entities: myEntities,
        },
      ]);
    }
  }

  private initGame() {
    this.entities.push(new SpectatorEntity(this, nextId()));
    this.updateSpectatorPosition();
  }

  private updateSpectatorPosition() {
    console.time('updating spectator');
    const cluster = Cluster.cluster(this.entities.map((a) => [a.x, a.y]));
    if (!cluster || cluster[0].elements.length === 0) {
      return;
    }
    const {centroid} = cluster.sort((a, b) => b.elements.length - a.elements.length)[0];
    const spectator = this.entities.array.find((a) => a instanceof SpectatorEntity);
    if (!spectator) {
      return;
    }
    spectator.x = centroid[0];
    spectator.y = centroid[1];
    console.timeEnd('updating spectator');
  }
}
