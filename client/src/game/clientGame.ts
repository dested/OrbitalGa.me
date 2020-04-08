import {ClientToServerMessage, ServerToClientMessage} from '@common/models/messages';
import {unreachable} from '@common/utils/unreachable';
import {uuid} from '@common/utils/uuid';
import {IClientSocket} from '../clientSocket';
import {GameConstants} from '@common/game/gameConstants';
import {Game} from '@common/game/game';
import {assertType, Utils} from '@common/utils/utils';
import {ClientLivePlayerEntity} from './entities/clientLivePlayerEntity';
import {ClientEntityTypes} from './entities/clientEntityTypeModels';
import {SpectatorEntity} from '@common/entities/spectatorEntity';
import {WorldEntityModelCastToEntityModel} from '@common/models/entityTypeModels';
import {Entity} from '@common/entities/entity';
import {ClientEntity} from './entities/clientEntity';

export type ClientGameOptions = {
  onDied: (me: ClientGame) => void;
  onOpen: (me: ClientGame) => void;
  onDisconnect: (me: ClientGame) => void;
};

export class ClientGame extends Game {
  connectionId: string;
  isDead: boolean = false;
  liveEntity?: ClientLivePlayerEntity;
  private messagesToProcess: ServerToClientMessage[] = [];
  private serverVersion: number = -1;
  protected spectatorMode: boolean = false;
  spectatorEntity?: SpectatorEntity;
  lastXY?: {x: number; y: number};

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
  setOptions(options: ClientGameOptions) {
    this.options = options;
  }

  joinGame() {
    this.lastXY = undefined;
    this.sendMessageToServer({type: 'join'});
  }
  spectateGame() {
    this.lastXY = undefined;
    this.sendMessageToServer({type: 'spectate'});
  }

  private startTick() {
    let time = +new Date();
    let paused = 0;
    const int = setInterval(() => {
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
      const now = +new Date();
      const duration = now - gameTime;
      if (duration > 900 || duration < 4) {
        gamePaused++;
      } else {
        if (gamePaused > 3) {
          gamePaused = 0;
        }
      }
      this.gameTick(duration);
      gameTime = +new Date();
      if (gameTime - now > 20) {
        console.log('bad duration', duration);
      }
      this.messagesToProcess.length = 0;
    }, GameConstants.serverTickRate);
  }

  sendMessageToServer(message: ClientToServerMessage) {
    this.socket.sendMessage(message);
  }

  private processMessages(messages: ServerToClientMessage[]) {
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          const clientEntity = new ClientLivePlayerEntity(this, message);
          this.serverVersion = message.serverVersion;
          console.log('Server version', this.serverVersion);
          this.isDead = false;
          this.lastXY = undefined;
          this.spectatorMode = false;
          this.liveEntity = clientEntity;
          this.entities.push(clientEntity);
          break;
        case 'spectating':
          this.serverVersion = message.serverVersion;
          this.lastXY = undefined;
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
              foundEntity = new ClientEntityTypes[messageEntity.entityType](
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

    const entities = this.entities.array;
    assertType<(Entity & ClientEntity)[]>(entities);
    for (const entity of entities) {
      entity.tick(duration);
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
      entity.updatePolygon();
    }
    this.collisionEngine.update();
    this.liveEntity?.checkCollisions();
  }

  private interpolateEntities() {
    const now = +new Date();
    const renderTimestamp = now - GameConstants.serverTickRate;

    for (const entity of this.entities.array) {
      entity.interpolateEntity(renderTimestamp);
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

  died() {
    this.isDead = true;
    this.lastXY = {x: this.liveEntity?.x ?? 0, y: this.liveEntity?.y ?? 0};
    this.liveEntity = undefined;
    this.options.onDied(this);
  }

  sendInput(input: ClientLivePlayerEntity['keys'] & {inputSequenceNumber: number}) {
    this.sendMessageToServer({type: 'playerInput', ...input});
  }
}
