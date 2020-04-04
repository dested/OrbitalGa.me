import {ClientToServerMessage, ServerToClientMessage} from '@common/models/messages';
import {unreachable} from '@common/utils/unreachable';
import {uuid} from '@common/utils/uuid';
import {IClientSocket} from '../clientSocket';
import {GameConstants} from '@common/game/gameConstants';
import {Game} from '@common/game/game';
import {assert} from '@common/utils/utils';
import {PlayerEntity} from '@common/entities/playerEntity';
import {WallEntity} from '@common/entities/wallEntity';
import {SwoopingEnemyEntity} from '@common/entities/swoopingEnemyEntity';
import {ShotEntity} from '@common/entities/shotEntity';
import {EnemyShotEntity} from '@common/entities/enemyShotEntity';
import {LivePlayerEntity} from './entities/livePlayerEntity';
import {ShotExplosionEntity} from '@common/entities/shotExplosionEntity';
import {ArrayHash} from '@common/utils/arrayHash';
import {Entity} from '@common/entities/entity';
import {ClientEntity} from './entities/clientEntity';
import {ClientPlayerEntity} from './entities/clientPlayerEntity';
import {ClientWallEntity} from './entities/clientWallEntity';
import {ClientShotEntity} from './entities/clientShotEntity';
import {ClientEnemyShotEntity} from './entities/clientEnemyShotEntity';
import {ClientSwoopingEnemyEntity} from './entities/clientSwoopingEnemyEntity';
import {ClientShotExplosionEntity} from './entities/clientShotExplosionEntity';

export class ClientGame extends Game {
  connectionId: string;
  protected isDead: boolean = false;
  protected liveEntity?: LivePlayerEntity;

  constructor(
    serverPath: string,
    private options: {onDied: (me: ClientGame) => void; onDisconnect: (me: ClientGame) => void},
    private socket: IClientSocket
  ) {
    super(true);
    this.connectionId = uuid();
    this.socket.connect(serverPath, {
      onOpen: () => {
        this.sendMessageToServer({type: 'join'});
      },
      onDisconnect: () => {
        options.onDisconnect(this);
      },

      onMessage: (messages) => {
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
    }, GameConstants.serverTickRate);
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
        case 'worldState':
          {
            for (let i = this.entities.length - 1; i >= 0; i--) {
              const entity = this.entities.getIndex(i);
              if (message.entities.find((a) => a.entityId === entity.entityId)) {
                continue;
              }
              entity.destroy();
              this.entities.remove(entity);
            }
            for (const entity of message.entities) {
              let foundEntity = this.entities.lookup(entity.entityId);
              if (!foundEntity) {
                switch (entity.entityType) {
                  case 'player':
                    const playerEntity = new ClientPlayerEntity(this, entity.entityId);
                    playerEntity.x = entity.x;
                    playerEntity.y = entity.y;
                    playerEntity.lastProcessedInputSequenceNumber = entity.lastProcessedInputSequenceNumber;
                    foundEntity = playerEntity;
                    break;
                  case 'wall':
                    const wallEntity = new ClientWallEntity(this, entity.entityId, entity.width, entity.height);
                    wallEntity.x = entity.x;
                    wallEntity.y = entity.y;
                    foundEntity = wallEntity;
                    wallEntity.updatePosition();
                    break;
                  case 'shot':
                    const shotEntity = new ClientShotEntity(
                      this,
                      entity.entityId,
                      entity.ownerEntityId,
                      entity.shotOffsetX,
                      entity.shotOffsetY
                    );
                    shotEntity.x = entity.x;
                    shotEntity.y = entity.y;
                    foundEntity = shotEntity;
                    if (entity.create) {
                      shotEntity.x =
                        shotEntity.ownerEntityId === this.liveEntity?.entityId ? this.liveEntity.drawX! : entity.x;
                      shotEntity.y =
                        shotEntity.ownerEntityId === this.liveEntity?.entityId ? this.liveEntity.drawY! : entity.y;
                      shotEntity.positionBuffer.push({
                        time: +new Date() - GameConstants.serverTickRate,
                        x: shotEntity.x,
                        y: shotEntity.y,
                      });
                    }
                    shotEntity.updatePosition();
                    break;
                  case 'enemyShot':
                    const enemyShotEntity = new ClientEnemyShotEntity(this, entity.entityId, entity.startY);
                    enemyShotEntity.x = entity.x;
                    enemyShotEntity.y = entity.y;
                    foundEntity = enemyShotEntity;
                    if (entity.create) {
                      enemyShotEntity.y = entity.startY;
                      enemyShotEntity.positionBuffer.push({
                        time: +new Date() - GameConstants.serverTickRate,
                        x: enemyShotEntity.x,
                        y: entity.startY,
                      });
                    }
                    enemyShotEntity.updatePosition();
                    break;
                  case 'swoopingEnemy':
                    const swoopingEnemy = new ClientSwoopingEnemyEntity(this, entity.entityId, entity.health);
                    swoopingEnemy.x = entity.x;
                    swoopingEnemy.y = entity.y;
                    swoopingEnemy.health = entity.health;
                    foundEntity = swoopingEnemy;

                    if (entity.create) {
                      swoopingEnemy.positionBuffer.push({
                        time: +new Date() - GameConstants.serverTickRate,
                        x: entity.x,
                        y: entity.y,
                      });
                    }

                    swoopingEnemy.updatePosition();
                    break;
                  case 'shotExplosion':
                    const shotExplosion = new ClientShotExplosionEntity(this, entity.entityId, entity.ownerEntityId);
                    shotExplosion.x = entity.x;
                    shotExplosion.y = entity.y;
                    shotExplosion.aliveDuration = entity.aliveDuration;
                    foundEntity = shotExplosion;
                    if (entity.create) {
                      shotExplosion.positionBuffer.push({
                        time: +new Date() - GameConstants.serverTickRate,
                        x: shotExplosion.x,
                        y: shotExplosion.y,
                      });
                    }
                    shotExplosion.updatePosition();
                    break;
                  default:
                    throw unreachable(entity);
                }
                this.entities.push(foundEntity);
              } else {
                switch (entity.entityType) {
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
                  case 'shotExplosion':
                    assert(foundEntity instanceof ShotExplosionEntity);
                    foundEntity.aliveDuration = entity.aliveDuration;
                    foundEntity.ownerEntityId = entity.ownerEntityId;
                    break;
                  default:
                    unreachable(entity);
                }
              }

              if (foundEntity.entityId === this.liveEntity?.entityId) {
                foundEntity.x = entity.x;
                foundEntity.y = entity.y;

                assert(foundEntity instanceof LivePlayerEntity && entity.entityType === 'player');

                foundEntity.momentum.x = entity.momentumX;
                foundEntity.momentum.y = entity.momentumY;
                for (let i = foundEntity.pendingInputs.length - 1; i >= 0; i--) {
                  const input = foundEntity.pendingInputs[i];
                  if (input.inputSequenceNumber <= entity.lastProcessedInputSequenceNumber) {
                    foundEntity.pendingInputs.splice(i, 1);
                  } else {
                    foundEntity.applyInput(input);
                    foundEntity.updatedPositionFromMomentum();
                  }
                }
              } else {
                foundEntity.positionBuffer.push({time: +new Date(), x: entity.x, y: entity.y});
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
    if (!this.connectionId || !this.liveEntity) {
      return;
    }
    this.liveEntity.xInputsThisTick = false;
    this.liveEntity.yInputsThisTick = false;
    this.processInputs(duration);
    this.liveEntity.tick();
    this.collisionEngine.update();
    this.liveEntity.checkCollisions();
  }

  private interpolateEntities() {
    const now = +new Date();
    const renderTimestamp = now - GameConstants.serverTickRate;

    for (const entity of this.entities.array) {
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
    liveEntity.positionLerp = {
      x: liveEntity.x,
      y: liveEntity.y,
      startTime: +new Date(),
      duration,
    };
    if (
      !liveEntity.keys.shoot &&
      !liveEntity.keys.left &&
      !liveEntity.keys.right &&
      !liveEntity.keys.up &&
      !liveEntity.keys.down
    ) {
      return;
    }

    // Package player's input.
    const input = {
      ...liveEntity.keys,
      inputSequenceNumber: liveEntity.inputSequenceNumber++,
    };

    liveEntity.pendingInputs.push(input);

    liveEntity.applyInput(input);
    this.sendMessageToServer({type: 'playerInput', ...input});
  }
}
