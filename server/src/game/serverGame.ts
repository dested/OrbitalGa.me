import {ClientToServerMessage, ServerToClientMessage} from '../../../common/src/models/messages';
import {unreachable} from '../../../common/src/utils/unreachable';
import {IServerSocket} from '../serverSocket';
import {nextId, uuid} from '../../../common/src/utils/uuid';
import {ColorUtils} from '../../../common/src/utils/colorUtils';
import {GameConstants} from '../../../common/src/game/gameConstants';
import {
  EnemyShotEntity,
  Entity,
  EntityTypeOptions,
  EntityTypes,
  PendingInput,
  PlayerEntity,
  ShotEntity,
  SwoopingEnemyEntity,
  WallEntity,
} from '../../../common/src/entities/entity';
import {Game} from '../../../common/src/game/game';
import {assert, assertType, Utils} from '../../../common/src/utils/utils';

export class ServerGame extends Game {
  users: {connectionId: string; entity: ServerPlayerEntity}[] = [];

  constructor(private serverSocket: IServerSocket) {
    super(false);
    serverSocket.start(
      connectionId => {},
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

    /*
    const wallEntity1 = new WallEntity(this, uuid(), 100, 1000);
    wallEntity1.x = 50;
    wallEntity1.y = 50;
    wallEntity1.updatePosition();
    this.entities.push(wallEntity1);
*/
    /*const wallEntity2 = new WallEntity(this, uuid(), 1000, 100);
    wallEntity2.x = 50;
    wallEntity2.y = 600;
    wallEntity2.updatePosition();
    this.entities.push(wallEntity2);*/

    const processTick = () => {
      try {
        const now = +new Date();
        const duration = now - time;
        if (duration > GameConstants.serverTickRate * 1.2) {
          console.log('bad duration', duration);
        }
        time = +new Date();
        console.time('server tick');
        const newTickTime = +new Date();
        this.serverTick(++serverTick, duration, tickTime);
        tickTime = +new Date() - newTickTime;
        console.timeEnd('server tick');
        // console.time('gc');
        // global.gc();
        // console.timeEnd('gc');
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
    const client = this.users.find(c => c.connectionId === connectionId);
    if (!client) {
      return;
    }
    this.users.splice(this.users.indexOf(client), 1);
    this.entities.splice(this.entities.indexOf(client.entity), 1);
  }

  clientJoin(connectionId: string) {
    // const teamId = uuid();
    // const color = ColorUtils.randomColor();
    const entity = new ServerPlayerEntity(this, nextId());

    const {x0, x1} = this.getPlayerRange(200);

    entity.x = Utils.randomInRange(x0, x1);
    entity.y = Math.random() * 400 + 600;
    this.users.push({connectionId, entity});
    this.entities.push(entity);
    this.sendMessageToClient(connectionId, {
      type: 'joined',
      entityId: entity.entityId,
      x: entity.x,
      y: entity.y,
      clientId: connectionId,
    });
  }

  serverTick(tickIndex: number, duration: number, tickTime: number) {
    /*
    console.log(
      `tick: ${tickIndex}, Users: ${this.users.length}, Entities: ${this.entities.length}, Messages:${this.queuedMessages.length}, Duration: ${tickTime}`
    );
*/

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
        case 'playerInput': {
          // if (this.validateInput(q.message)) {
          const user = this.users.find(a => a.connectionId === q.connectionId);
          if (user) {
            user.entity.applyInput(q.message);
            this.collisionEngine.update();
            user.entity.checkCollisions();
          } // }

          break;
        }
        default:
          unreachable(q.message);
      }
    }

    if (!stopped) {
      this.queuedMessages.length = 0;
    } else {
      console.log(this.queuedMessages.length, 'remaining');
    }

    if (tickIndex % 50 < 4) {
      if (this.users.length > 0) {
        for (let i = 0; i < 10; i++) {
          const {x0, x1} = this.getPlayerRange(200);
          this.createEntity('swoopingEnemy', {
            x: Utils.randomInRange(x0, x1),
            y: -100 + Math.random() * 150,
            health: 10,
          });
        }
      }
    }

    for (const entity of this.entities) {
      entity.tick(duration);
    }

    this.checkCollisions();

    this.sendMessageToClients({
      type: 'worldState',
      entities: this.entities.map(entity => {
        switch (entity.type) {
          case 'player':
            assert(entity instanceof PlayerEntity);
            return {
              x: entity.x,
              y: entity.y,
              entityId: entity.entityId,
              lastProcessedInputSequenceNumber: entity.lastProcessedInputSequenceNumber,
              type: 'player',
            };
          case 'wall':
            assert(entity instanceof WallEntity);
            return {
              x: entity.x,
              y: entity.y,
              width: entity.width,
              height: entity.height,
              entityId: entity.entityId,
              type: 'wall',
            };
          case 'swoopingEnemy':
            assert(entity instanceof SwoopingEnemyEntity);
            return {
              x: entity.x,
              y: entity.y,
              health: entity.health,
              entityId: entity.entityId,
              type: 'swoopingEnemy',
            };
          case 'shot':
            assert(entity instanceof ShotEntity);
            return {
              x: entity.x,
              y: entity.y,
              entityId: entity.entityId,
              markToDestroy: entity.markToDestroy,
              type: 'shot',
            };
          case 'enemyShot':
            assert(entity instanceof EnemyShotEntity);
            return {
              x: entity.x,
              y: entity.y,
              entityId: entity.entityId,
              markToDestroy: entity.markToDestroy,
              type: 'enemyShot',
            };
          default:
            throw unreachable(entity.type);
        }
      }),
    });

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (entity.markToDestroy) {
        this.entities.splice(i, 1);
      }
    }

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

  createEntity(entityType: EntityTypes, options: EntityTypeOptions[typeof entityType]) {
    switch (entityType) {
      case 'player':
        break;
      case 'wall':
        break;
      case 'shot':
        {
          assertType<EntityTypeOptions[typeof entityType]>(options);
          const shotEntity = new ShotEntity(this, nextId());
          shotEntity.start(options.x, options.y);
          this.sendMessageToClients({
            type: 'createEntity',
            entityType,
            entityId: shotEntity.entityId,
            x: shotEntity.x,
            y: shotEntity.y,
          });
          this.entities.push(shotEntity);
        }
        break;
      case 'swoopingEnemy': {
        assertType<EntityTypeOptions[typeof entityType]>(options);
        const swoopingEnemyEntity = new SwoopingEnemyEntity(this, nextId(), options.health);
        swoopingEnemyEntity.setStartPosition(options.x, options.y);
        swoopingEnemyEntity.start(options.x, options.y);
        this.sendMessageToClients({
          type: 'createEntity',
          entityType,
          health: swoopingEnemyEntity.health,
          entityId: swoopingEnemyEntity.entityId,
          x: swoopingEnemyEntity.x,
          y: swoopingEnemyEntity.y,
        });
        this.entities.push(swoopingEnemyEntity);
        break;
      }
      case 'enemyShot': {
        assertType<EntityTypeOptions[typeof entityType]>(options);
        const shotEntity = new EnemyShotEntity(this, nextId());
        shotEntity.start(options.x, options.y);
        this.sendMessageToClients({
          type: 'createEntity',
          entityType,
          entityId: shotEntity.entityId,
          x: shotEntity.x,
          y: shotEntity.y,
        });
        this.entities.push(shotEntity);
        break;
      }
      default:
        unreachable(entityType);
        break;
    }
  }

  private getPlayerRange(padding: number) {
    const range = {x0: Number.POSITIVE_INFINITY, x1: Number.NEGATIVE_INFINITY};
    if (this.users.length === 0) {
      return {x0: 0, x1: 0};
    }
    for (const user of this.users) {
      if (!user.entity) {
        continue;
      }
      range.x0 = Math.min(range.x0, user.entity.x);
      range.x1 = Math.max(range.x1, user.entity.x);
    }
    return {x0: range.x0 - padding, x1: range.x1 + padding};
  }
}

export class ServerPlayerEntity extends PlayerEntity {
  tick(): void {
    super.tick();
  }
  applyInput(input: PendingInput) {
    super.applyInput(input);
    this.lastProcessedInputSequenceNumber = input.inputSequenceNumber;
  }
}
