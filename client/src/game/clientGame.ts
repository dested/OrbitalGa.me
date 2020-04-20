import {unreachable} from '@common/utils/unreachable';
import {IClientSocket} from '../clientSocket';
import {GameConstants} from '@common/game/gameConstants';
import {Game} from '@common/game/game';
import {assertType, Utils} from '@common/utils/utils';
import {ClientLivePlayerEntity} from './entities/clientLivePlayerEntity';
import {ClientEntityTypes} from './entities/clientEntityTypeModels';
import {SpectatorEntity} from '@common/entities/spectatorEntity';
import {WorldModelCastToEntityModel} from '@common/models/entityTypeModels';
import {Entity} from '@common/entities/entity';
import {ClientEntity} from './entities/clientEntity';
import {RollingAverage} from '@common/utils/rollingAverage';
import {LeaderboardEntryRanked} from '@common/game/gameLeaderboard';
import {STOCError, ServerToClientMessage} from '@common/models/serverToClientMessages';
import {ClientToServerMessage} from '@common/models/clientToServerMessages';

export type ClientGameOptions = {
  onDied: (me: ClientGame) => void;
  onDisconnect: (me: ClientGame) => void;
  onError: (client: ClientGame, error: STOCError) => void;
  onOpen: (me: ClientGame) => void;
  onReady: (me: ClientGame) => void;
  onUIUpdate: (me: ClientGame) => void;
};

export class ClientGame extends Game {
  debugValues: {[key: string]: number | string} = {};
  drawTick = 0;
  isDead: boolean = false;
  lagAverage = new RollingAverage();
  lastXY?: {x: number; y: number};
  leaderboardScores: LeaderboardEntryRanked[] = [];
  liveEntity?: ClientLivePlayerEntity;
  pingIndex = 0;
  pings: {[pingIndex: number]: number} = {};
  spectatorEntity?: SpectatorEntity;
  protected latency: number = 0;
  protected spectatorMode: boolean = false;
  private connected = false;
  private lastWorldStateTick: number = +new Date();
  private messagesToProcess: ServerToClientMessage[] = [];
  private serverVersion: number = -1;

  constructor(private serverPath: string, public options: ClientGameOptions, public socket: IClientSocket) {
    super(true);
    this.connect();
  }
  clearDebug(key: string) {
    delete this.debugValues[key];
  }

  connect() {
    this.connected = true;
    this.socket.connect(this.serverPath, {
      onOpen: () => {
        this.options.onOpen(this);
      },
      onDisconnect: () => {
        this.options.onDisconnect(this);
        this.connected = false;
      },
      onMessage: (messages) => {
        this.processMessages(messages);
        this.messagesToProcess.push(...messages);
      },
    });

    this.startTick();
  }

  died() {
    this.isDead = true;
    this.lastXY = {x: this.liveEntity?.x ?? 0, y: this.liveEntity?.y ?? 0};
    this.liveEntity = undefined;
    this.options.onDied(this);
  }

  disconnect() {
    this.socket.disconnect();
  }

  gameTick(duration: number) {
    this.processInputs(duration);
    this.liveEntity?.gameTick();
    for (const entity of this.entities.array) {
      entity.updatePolygon();
    }
    this.collisionEngine.update();
    this.liveEntity?.checkCollisions();
    for (const entity of this.entities.array) {
      if (entity.type === 'drop') {
        entity.checkCollisions();
      }
    }
    for (const entity of this.entities.array) {
      if (entity.markToDestroy) {
        assertType<Entity & ClientEntity>(entity);
        (entity as ClientEntity).destroyClient();
      }
    }
  }

  joinGame(name: string) {
    this.lastXY = undefined;
    this.sendMessageToServer({type: 'join', name});
  }

  sendInput(input: ClientLivePlayerEntity['keys'], inputSequenceNumber: number) {
    this.sendMessageToServer({type: 'playerInput', inputSequenceNumber, weapon: input.weapon, keys: input});
  }

  sendMessageToServer(message: ClientToServerMessage) {
    this.socket.sendMessage(message);
  }
  setDebug(key: string, value: number | string) {
    this.debugValues[key] = value;
  }
  setOptions(options: ClientGameOptions) {
    this.options = options;
  }
  spectateGame() {
    this.lastXY = undefined;
    this.sendMessageToServer({type: 'spectate'});
  }
  tick(duration: number) {
    const entities = this.entities.array;
    assertType<(Entity & ClientEntity)[]>(entities);
    for (const entity of entities) {
      entity.tick(duration);
    }
    this.interpolateEntities();
  }

  private interpolateEntities() {
    const now = +new Date();
    const renderTimestamp = now - GameConstants.serverTickRate;

    for (const entity of this.entities.array) {
      entity.interpolateEntity(renderTimestamp);
    }
  }

  private processInputs(duration: number) {
    this.liveEntity?.processInput(duration);
  }

  private processMessages(messages: ServerToClientMessage[]) {
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          const clientEntity = new ClientLivePlayerEntity(this, {...message.player, type: 'livePlayer'});
          this.serverVersion = message.serverVersion;
          if (this.serverVersion !== GameConstants.serverVersion) {
            alert('Sorry, this client is out of date, please refresh this window.');
            throw new Error('Out of date');
          }
          console.log('Server version', this.serverVersion);
          this.isDead = false;
          this.lastXY = undefined;
          this.spectatorMode = false;
          this.liveEntity = clientEntity;
          this.entities.push(clientEntity);
          this.options.onReady(this);
          break;
        case 'error':
          switch (message.reason) {
            case 'nameInUse':
            case '500':
            case 'spectatorCapacity':
            case 'userCapacity':
              this.options.onError(this, message);
              break;
            default:
              unreachable(message);
          }
          break;
        case 'spectating':
          this.serverVersion = message.serverVersion;
          this.lastXY = undefined;
          this.spectatorMode = true;
          console.log('Server version', this.serverVersion);
          break;
        case 'leaderboard':
          this.leaderboardScores = message.scores;
          break;
        case 'pong':
          if (!(message.ping in this.pings)) {
            throw new Error('Unmatched ping.');
          }
          const time = this.pings[message.ping];
          this.latency = Math.max(+new Date() - time - GameConstants.serverTickRate, 0);
          delete this.pings[message.ping];
          break;
        case 'worldState':
          this.lagAverage.push(GameConstants.serverTickRate - (+new Date() - this.lastWorldStateTick));
          this.lastWorldStateTick = +new Date();
          const entityMap = Utils.toDictionary(message.entities, (a) => a.entityId);
          for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities.getIndex(i);
            assertType<Entity & ClientEntity>(entity);
            entity.clientDestroyed = false;
            if (entityMap[entity.entityId]) {
              continue;
            }
            entity.destroy();
            this.entities.remove(entity);
          }
          for (const messageModel of message.entities) {
            let foundEntity = this.entities.lookup(messageModel.entityId);
            if (!foundEntity) {
              foundEntity = new ClientEntityTypes[messageModel.type](this, messageModel as WorldModelCastToEntityModel);
              this.entities.push(foundEntity);
            }
            foundEntity.reconcileFromServer(messageModel);
          }
          break;
        default:
          unreachable(message);
          break;
      }
    }
  }

  private startTick() {
    let time = +new Date();
    let paused = 0;
    const int = setInterval(() => {
      if (!this.connected) {
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
      if (!this.connected) {
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
      this.gameTick(duration);
      this.options.onUIUpdate(this);
      gameTime = +new Date();
      if (gameTime - now > 20) {
        console.log('bad duration', duration);
      }
      this.messagesToProcess.length = 0;
    }, GameConstants.serverTickRate);

    const pingInterval = setInterval(() => {
      if (!this.connected) {
        clearInterval(pingInterval);
        return;
      }
      this.pingIndex++;
      this.pings[this.pingIndex] = +new Date();
      this.socket.sendMessage({type: 'ping', ping: this.pingIndex});
    }, GameConstants.pingInterval);
  }
}
