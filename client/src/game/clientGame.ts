import {ClientToServerMessage, ServerToClientMessage} from '../../../common/src/models/messages';
import {unreachable} from '../../../common/src/utils/unreachable';
import {uuid} from '../../../common/src/utils/uuid';
import {ClientSocket, IClientSocket} from '../clientSocket';
import {GameConstants} from '../../../common/src/game/gameConstants';
import {
  EnemyShotEntity,
  Entity,
  EntityTypeOptions,
  EntityTypes,
  PlayerEntity,
  ShotEntity,
  SwoopingEnemyEntity,
  WallEntity,
} from '../../../common/src/entities/entity';
import {Game} from '../../../common/src/game/game';
import {assert, Utils} from '../../../common/src/utils/utils';

export class ClientGame extends Game {
  connectionId: string;
  protected isDead: boolean = false;

  protected liveEntity?: LivePlayerEntity;

  constructor(
    private options: {onDied: (me: ClientGame) => void; onDisconnect: (me: ClientGame) => void},
    private socket: IClientSocket
  ) {
    super(true);
    this.connectionId = uuid();
    this.socket.connect({
      onOpen: () => {
        this.sendMessageToServer({type: 'join'});
      },
      onDisconnect: () => {
        options.onDisconnect(this);
      },

      onMessage: messages => {
        this.processMessages(messages);
      },
    });

    this.startTick();
  }

  private startTick() {
    let time = +new Date();
    let paused = 0;
    const int = setInterval(() => {
      if (this.isDead) {
        clearInterval(int);
        return;
      }
      const now = +new Date();
      const duration = now - time;
      if (duration > 900 || duration < 4) {
        paused++;
      } else {
        if (paused > 3) {
          paused = 0;
          /*
           console.log('resync');
          this.sendMessageToServer({
            type: 'resync',
          });
*/
        }
      }
      this.tick(duration);
      time = +new Date();
    }, 1000 / 60);

    let gameTime = +new Date();
    let gamePaused = 0;
    const gameInt = setInterval(() => {
      if (this.isDead) {
        clearInterval(gameInt);
        return;
      }
      const now = +new Date();
      const duration = now - gameTime;
      if (duration > 900 || duration < 4) {
        gamePaused++;
      } else {
        if (gamePaused > 3) {
          gamePaused = 0;
          /*
           console.log('resync');
          this.sendMessageToServer({
            type: 'resync',
          });
*/
        }
      }
      this.gameTick(duration);
      gameTime = +new Date();
    }, GameConstants.clientTickRate);
  }

  sendMessageToServer(message: ClientToServerMessage) {
    this.socket.sendMessage(message);
  }

  processMessages(messages: ServerToClientMessage[]) {
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          {
            const clientEntity = new LivePlayerEntity(this, message.entityId);
            clientEntity.x = message.x;
            clientEntity.y = message.y;
            this.liveEntity = clientEntity;
            this.entities.push(clientEntity);
          }
          break;
        case 'createEntity':
          {
            switch (message.entityType) {
              case 'shot':
                const shotEntity = new ShotEntity(this, message.entityId);
                shotEntity.x = message.x;
                shotEntity.y = message.y;
                shotEntity.positionBuffer.push({
                  time: +new Date() - GameConstants.serverTickRate,
                  x: message.x,
                  y: message.y,
                });
                shotEntity.updatePosition();
                this.entities.push(shotEntity);
                break;
              case 'enemyShot':
                const enemyShotEntity = new EnemyShotEntity(this, message.entityId);
                enemyShotEntity.x = message.x;
                enemyShotEntity.y = message.y;
                enemyShotEntity.positionBuffer.push({
                  time: +new Date() - GameConstants.serverTickRate,
                  x: message.x,
                  y: message.y,
                });
                enemyShotEntity.updatePosition();
                this.entities.push(enemyShotEntity);
                break;
              case 'swoopingEnemy':
                const swoopingEnemyEntity = new SwoopingEnemyEntity(this, message.entityId, message.health);
                swoopingEnemyEntity.x = message.x;
                swoopingEnemyEntity.y = message.y;
                swoopingEnemyEntity.positionBuffer.push({
                  time: +new Date() - GameConstants.serverTickRate,
                  x: message.x,
                  y: message.y,
                });
                swoopingEnemyEntity.updatePosition();
                this.entities.push(swoopingEnemyEntity);
                break;

              default:
                unreachable(message);
                break;
            }
          }
          break;
        case 'worldState':
          {
            for (let i = this.entities.length - 1; i >= 0; i--) {
              const entity = this.entities[i];
              if (message.entities.find(a => a.entityId === entity.entityId)) {
                continue;
              }
              this.entities.splice(i, 1);
            }
            for (const entity of message.entities) {
              let foundEntity = this.entities.find(a => a.entityId === entity.entityId);
              if (!foundEntity) {
                switch (entity.type) {
                  case 'player':
                    const playerEntity = new PlayerEntity(this, entity.entityId);
                    playerEntity.x = entity.x;
                    playerEntity.y = entity.y;
                    playerEntity.lastProcessedInputSequenceNumber = entity.lastProcessedInputSequenceNumber;
                    foundEntity = playerEntity;
                    break;
                  case 'wall':
                    const wallEntity = new WallEntity(this, entity.entityId, entity.width, entity.height);
                    wallEntity.x = entity.x;
                    wallEntity.y = entity.y;
                    foundEntity = wallEntity;
                    wallEntity.updatePosition();
                    break;
                  case 'shot':
                    const shotEntity = new ShotEntity(this, entity.entityId);
                    shotEntity.x = entity.x;
                    shotEntity.y = entity.y;
                    foundEntity = shotEntity;
                    shotEntity.updatePosition();
                    break;
                  case 'enemyShot':
                    const enemyShotEntity = new EnemyShotEntity(this, entity.entityId);
                    enemyShotEntity.x = entity.x;
                    enemyShotEntity.y = entity.y;
                    foundEntity = enemyShotEntity;
                    enemyShotEntity.updatePosition();
                    break;
                  case 'swoopingEnemy':
                    const swoopingEnemy = new SwoopingEnemyEntity(this, entity.entityId, entity.health);
                    swoopingEnemy.x = entity.x;
                    swoopingEnemy.y = entity.y;
                    swoopingEnemy.health = entity.health;
                    foundEntity = swoopingEnemy;
                    swoopingEnemy.updatePosition();
                    break;

                  default:
                    throw unreachable(entity);
                }
                this.entities.push(foundEntity);
              }

              if (foundEntity.entityId === this.liveEntity?.entityId) {
                foundEntity.x = entity.x;
                foundEntity.y = entity.y;

                assert(foundEntity instanceof LivePlayerEntity && entity.type === 'player');
                let j = 0;
                while (j < foundEntity.pendingInputs.length) {
                  const input = foundEntity.pendingInputs[j];
                  if (input.inputSequenceNumber <= entity.lastProcessedInputSequenceNumber) {
                    foundEntity.pendingInputs.splice(j, 1);
                  } else {
                    foundEntity.applyInput(input);
                    j++;
                  }
                }
              } else {
                foundEntity.positionBuffer.push({time: +new Date(), x: entity.x, y: entity.y});
              }

              switch (entity.type) {
                case 'player':
                  break;
                case 'wall':
                  break;
                case 'shot':
                  break;
                case 'enemyShot':
                  break;
                case 'swoopingEnemy':
                  assert(foundEntity instanceof SwoopingEnemyEntity);
                  foundEntity.health = entity.health;
                  break;
                default:
                  unreachable(entity);
              }
            }
          }
          break;
        default:
          unreachable(message);
          break;
      }
    }
  }
  tick(duration: number) {
    if (!this.connectionId) {
      return;
    }
    this.interpolateEntities();
  }

  gameTick(duration: number) {
    if (!this.connectionId) {
      return;
    }

    this.processInputs(duration);
    for (const entity of this.entities) {
      // entity.tick(duration);
    }
    this.checkCollisions();
  }

  private interpolateEntities() {
    const now = +new Date();
    const renderTimestamp = now - GameConstants.serverTickRate;

    for (const i in this.entities) {
      const entity = this.entities[i];

      if (entity === this.liveEntity) continue;

      // Find the two authoritative positions surrounding the rendering timestamp.
      const buffer = entity.positionBuffer;

      // Drop older positions.
      while (buffer.length >= 2 && buffer[1].time <= renderTimestamp) {
        buffer.shift();
      }

      // Interpolate between the two surrounding authoritative positions.
      if (buffer.length >= 2 && buffer[0].time <= renderTimestamp && renderTimestamp <= buffer[1].time) {
        const x0 = buffer[0].x;
        const x1 = buffer[1].x;
        const y0 = buffer[0].y;
        const y1 = buffer[1].y;
        const t0 = buffer[0].time;
        const t1 = buffer[1].time;

        entity.x = x0 + ((x1 - x0) * (renderTimestamp - t0)) / (t1 - t0);
        entity.y = y0 + ((y1 - y0) * (renderTimestamp - t0)) / (t1 - t0);
      }
    }
  }

  disconnect() {
    this.socket.disconnect();
  }

  private processInputs(duration: number) {
    const liveEntity = this.liveEntity;
    if (!liveEntity) return;

    if (
      !liveEntity.keys.shoot &&
      !liveEntity.keys.left &&
      !liveEntity.keys.right &&
      !liveEntity.keys.up &&
      !liveEntity.keys.down
    ) {
      return;
    }

    // Compute delta time since last update.
    const durationSeconds = duration / 1000.0;

    // Package player's input.
    const input = {
      pressTime: durationSeconds,
      ...liveEntity.keys,
      inputSequenceNumber: liveEntity.inputSequenceNumber++,
    };

    liveEntity.pendingInputs.push(input);
    liveEntity.positionLerp = {
      x: liveEntity.x,
      y: liveEntity.y,
      startTime: +new Date(),
      duration,
    };
    liveEntity.applyInput(input);
    this.sendMessageToServer({type: 'playerInput', ...input});
  }

  createEntity<T extends EntityTypes>(type: T, options: EntityTypeOptions[T]): void {}
}

export class LivePlayerEntity extends PlayerEntity {
  constructor(game: Game, public entityId: string) {
    super(game, entityId);
  }

  positionLerp?: {startTime: number; duration: number; x: number; y: number};
  tick(): void {}

  keys = {up: false, down: false, left: false, right: false, shoot: false};

  pressUp() {
    this.keys.up = true;
  }
  pressShoot() {
    this.keys.shoot = true;
  }
  pressDown() {
    this.keys.down = true;
  }
  pressLeft() {
    this.keys.left = true;
  }
  pressRight() {
    this.keys.right = true;
  }
  releaseUp() {
    this.keys.up = false;
  }
  releaseShoot() {
    this.keys.shoot = false;
  }
  releaseDown() {
    this.keys.down = false;
  }
  releaseLeft() {
    this.keys.left = false;
  }
  releaseRight() {
    this.keys.right = false;
  }

  get drawX(): number {
    if (!this.positionLerp) {
      return this.x;
    } else {
      const {x, y, startTime, duration} = this.positionLerp;
      const now = +new Date();
      if (now >= startTime + duration) {
        return this.x;
      } else {
        return Utils.lerp(x, this.x, (now - startTime) / duration);
      }
    }
  }
  get drawY(): number {
    if (!this.positionLerp) {
      return this.y;
    } else {
      const {x, y, startTime, duration} = this.positionLerp;
      const now = +new Date();
      if (now >= startTime + duration) {
        return this.y;
      } else {
        return Utils.lerp(y, this.y, (now - startTime) / duration);
      }
    }
  }
}
