import {ClientToServerMessage, ServerToClientMessage} from '@common/models/messages';
import {unreachable} from '@common/utils/unreachable';
import {uuid} from '@common/utils/uuid';
import {IClientSocket} from '../clientSocket';
import {GameConstants} from '@common/game/gameConstants';
import {Game} from '@common/game/game';
import {Utils} from '@common/utils/utils';
import {LivePlayerEntity} from './entities/livePlayerEntity';
import {EntityTypes, WorldEntityModelCastToEntityModel} from './entities/entityTypeModels';
import {SpectatorEntity} from '@common/entities/spectatorEntity';

export type ClientGameOptions = {
  onDied: (me: ClientGame) => void;
  onOpen: (me: ClientGame) => void;
  onDisconnect: (me: ClientGame) => void;
};

export class ClientGame extends Game {
  connectionId: string;
  isDead: boolean = false;
  liveEntity?: LivePlayerEntity;
  private messagesToProcess: ServerToClientMessage[] = [];
  private serverVersion: number = -1;
  protected spectatorMode: boolean = false;
  spectatorEntity?: SpectatorEntity;

  constructor(serverPath: string, private options: ClientGameOptions, private socket: IClientSocket) {
    super(true);
    this.connectionId = uuid();
    this.socket.connect(serverPath, {
      onOpen: () => {
        options.onOpen(this);
      },
      onDisconnect: () => {
        options.onDisconnect(this);
      },

      onMessage: (messages) => {
        this.processMessages(messages);
        this.messagesToProcess.push(...messages);
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
        }
      }
      this.gameTick(GameConstants.serverTickRate);
      gameTime = +new Date();
      if (gameTime - now > 20) {
        console.log('bad duratione', duration);
      }
      this.messagesToProcess.length = 0;
    }, GameConstants.serverTickRate);
  }

  sendMessageToServer(message: ClientToServerMessage) {
    this.socket.sendMessage(message);
  }

  processMessages(messages: ServerToClientMessage[]) {
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          const clientEntity = new LivePlayerEntity(this, message.entityId);
          clientEntity.x = message.x;
          clientEntity.y = message.y;
          this.serverVersion = message.serverVersion;
          console.log('Server version', this.serverVersion);
          this.spectatorMode = false;
          this.liveEntity = clientEntity;
          this.entities.push(clientEntity);
          break;
        case 'spectating':
          this.serverVersion = message.serverVersion;
          this.spectatorMode = true;
          console.log('Server version', this.serverVersion);
          break;
        case 'worldState':
          const entityMap = Utils.toDictionary(message.entities, (a) => a.entityId);
          for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities.getIndex(i);
            if (entityMap[entity.entityId]) {
              continue;
            }
            entity.destroy();
            this.entities.remove(entity);
          }
          for (const messageEntity of message.entities) {
            let foundEntity = this.entities.lookup(messageEntity.entityId);
            if (!foundEntity) {
              foundEntity = new EntityTypes[messageEntity.entityType](
                this,
                messageEntity as WorldEntityModelCastToEntityModel
              );
              this.entities.push(foundEntity);
            }

            foundEntity.reconcileFromServer(messageEntity);
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
    this.liveEntity?.gameTick();
    for (const entity of this.entities.array) {
      entity.updatePosition();
    }
    this.collisionEngine.update();
    this.liveEntity?.checkCollisions();
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
      if (buffer.length >= 2 && buffer[0].time <= renderTimestamp) {
        // exterpolate out x and y
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
    this.liveEntity?.processInput(duration);
  }

  debugValues: {[key: string]: number | string} = {};
  setDebug(key: string, value: number | string) {
    this.debugValues[key] = value;
  }
  clearDebug(key: string) {
    delete this.debugValues[key];
  }
}
