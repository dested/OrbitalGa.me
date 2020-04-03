import {ClientToServerMessage, ServerToClientMessage} from '@common/models/messages';
import {unreachable} from '@common/utils/unreachable';
import {IServerSocket} from '../serverSocket';
import {nextId} from '@common/utils/uuid';
import {GameConstants} from '@common/game/gameConstants';
import {EntityTypeOptions, EntityTypes} from '@common/entities/entity';
import {Game} from '@common/game/game';
import {assert, assertType, Utils} from '@common/utils/utils';
import {PlayerEntity} from '@common/entities/playerEntity';
import {WallEntity} from '@common/entities/wallEntity';
import {SwoopingEnemyEntity} from '@common/entities/swoopingEnemyEntity';
import {ShotEntity} from '@common/entities/shotEntity';
import {EnemyShotEntity} from '@common/entities/enemyShotEntity';
import {ServerPlayerEntity} from './entities/serverPlayerEntity';
import {ShotExplosionEntity} from '@common/entities/shotExplosionEntity';

export class ServerGame extends Game {
  users: {connectionId: string; entity: ServerPlayerEntity}[] = [];

  constructor(private serverSocket: IServerSocket) {
    super(false);
    serverSocket.start(
      (connectionId) => {},
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
    const user = this.users.find((c) => c.connectionId === connectionId);
    if (!user) {
      return;
    }
    this.users.splice(this.users.indexOf(user), 1);
    this.entities.splice(this.entities.indexOf(user.entity), 1);
  }

  clientJoin(connectionId: string) {
    // const teamId = uuid();
    // const color = ColorUtils.randomColor();
    const entity = new ServerPlayerEntity(this, nextId());

    const {x0, x1} = this.getPlayerRange(200, (e) => e.type === 'player');

    entity.x = Utils.randomInRange(x0, x1);
    entity.y = GameConstants.screenSize.height * 0.8;
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

    for (const user of this.users) {
      user.entity.inputsThisTick = false;
    }

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
          const user = this.users.find((a) => a.connectionId === q.connectionId);
          if (user) {
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

    if (!stopped) {
      this.queuedMessages.length = 0;
    } else {
      console.log(this.queuedMessages.length, 'remaining');
    }

    if (tickIndex % 50 < 2) {
      const enemyCount = this.users.length;
      for (let i = 0; i < enemyCount; i++) {
        const {x0, x1} = this.getPlayerRange(200, (entity) => entity.type === 'player');
        this.createEntity('swoopingEnemy', {
          x: Utils.randomInRange(x0, x1),
          y: -GameConstants.screenSize.height * 0.1 + Math.random() * GameConstants.screenSize.height * 0.15,
          health: 10,
        });
      }
    }

    for (const entity of this.entities) {
      entity.tick(duration);
    }

    this.checkCollisions();

    this.sendMessageToClients({
      type: 'worldState',
      entities: this.entities.map((entity) => {
        switch (entity.type) {
          case 'player':
            assert(entity instanceof PlayerEntity);
            return {
              x: entity.x,
              y: entity.y,
              momentumX: entity.momentum.x,
              momentumY: entity.momentum.y,
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
              ownerEntityId: entity.ownerEntityId,
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
          case 'shotExplosion':
            assert(entity instanceof ShotExplosionEntity);
            return {
              x: entity.x,
              y: entity.y,
              entityId: entity.entityId,
              aliveDuration: entity.aliveDuration,
              type: 'shotExplosion',
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

  createEntity<T extends EntityTypes>(entityType: T, options: EntityTypeOptions[T]) {
    switch (entityType) {
      case 'player':
        assertType<'player'>(entityType);
        break;
      case 'wall':
        assertType<'wall'>(entityType);
        break;
      case 'shot':
        {
          assertType<'shot'>(entityType);
          assertType<EntityTypeOptions[typeof entityType]>(options);
          const shotEntity = new ShotEntity(this, nextId(), options.ownerEntityId);
          shotEntity.start(options.x, options.y);
          this.sendMessageToClients({
            type: 'createEntity',
            entityType,
            entityId: shotEntity.entityId,
            ownerEntityId: shotEntity.ownerEntityId,
            x: shotEntity.x,
            y: shotEntity.y,
          });
          this.entities.push(shotEntity);
        }
        break;
      case 'swoopingEnemy': {
        assertType<'swoopingEnemy'>(entityType);
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
        assertType<'enemyShot'>(entityType);
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
      case 'shotExplosion': {
        assertType<'shotExplosion'>(entityType);
        assertType<EntityTypeOptions[typeof entityType]>(options);
        const shotExplosionEntity = new ShotExplosionEntity(this, nextId());
        shotExplosionEntity.start(options.x, options.y);
        this.sendMessageToClients({
          type: 'createEntity',
          entityType,
          entityId: shotExplosionEntity.entityId,
          aliveDuration: shotExplosionEntity.aliveDuration,
          x: shotExplosionEntity.x,
          y: shotExplosionEntity.y,
        });
        this.entities.push(shotExplosionEntity);
        break;
      }
    }
  }
}
