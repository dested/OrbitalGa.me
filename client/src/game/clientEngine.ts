import {unreachable} from '@common/utils/unreachable';
import {GameConstants} from '@common/game/gameConstants';
import {Game} from '@common/game/game';
import {assertType, Utils} from '@common/utils/utils';
import {ClientLivePlayerEntity} from './entities/clientLivePlayerEntity';
import {ClientEntityTypes} from './entities/clientEntityTypeModels';
import {SpectatorEntity} from '@common/entities/spectatorEntity';
import {WorldModelCastToEntityModel} from '@common/models/serverToClientMessages';
import {Entity} from '@common/entities/entity';
import {ClientEntity} from './entities/clientEntity';
import {RollingAverage} from '@common/utils/rollingAverage';
import {LeaderboardEntryRanked} from '@common/game/gameLeaderboard';
import {STOCError, ServerToClientMessage} from '@common/models/serverToClientMessages';
import {ClientToServerMessage} from '@common/models/clientToServerMessages';
import {PlayerEntity} from '@common/entities/playerEntity';
import {IClientSocket} from '../socket/IClientSocket';

export type ClientGameOptions = {
  onDied: (me: ClientEngine) => void;
  onDisconnect: (me: ClientEngine) => void;
  onError: (client: ClientEngine, error: STOCError) => void;
  onOpen: (me: ClientEngine) => void;
  onReady: (me: ClientEngine) => void;
  onUIUpdate: (me: ClientEngine) => void;
};

export abstract class ClientEngine {
  debugValues: {[key: string]: number | string} = {};
  drawTick = 0;
  isDead: boolean = false;
  lastXY?: {x: number; y: number};
  leaderboardScores: LeaderboardEntryRanked[] = [];
  myScore?: LeaderboardEntryRanked;
  playerEntityId?: number;

  protected spectatorMode: boolean = false;
  private connected = false;
  private messagesToProcess: ServerToClientMessage[] = [];
  private serverVersion: number = -1;
  private totalPlayers: number = 0;

  constructor(
    private serverPath: string,
    public options: ClientGameOptions,
    public socket: IClientSocket,
    protected game: Game
  ) {
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
        this.messagesToProcess.push(...messages);
      },
    });

    this.startTick();
  }

  died() {
    if (!this.isDead) {
      this.isDead = true;
      this.lastXY = {x: this.liveEntity?.x ?? 0, y: this.liveEntity?.y ?? 0};
      this.liveEntity = undefined;
      this.options.onDied(this);
    }
  }

  disconnect() {
    this.socket.disconnect();
  }

  gameTick(duration: number) {
    this.processMessages(this.messagesToProcess);
    this.liveEntity?.processInput(duration);

    this.game.gameTick(0, duration);

    for (const entity of this.game.entities.array) {
      if (entity.markToDestroy) {
        assertType<Entity & ClientEntity>(entity);
        (entity as ClientEntity).destroyClient();
      }
    }
  }

  joinGame() {
    this.lastXY = undefined;
    this.sendMessageToServer({type: 'join'});
  }

  killPlayer(player: PlayerEntity): void {}

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

  private processMessages(messages: ServerToClientMessage[]) {
    for (const message of messages) {
      switch (message.type) {
        case 'joined':
          this.serverVersion = message.serverVersion;
          if (this.serverVersion !== GameConstants.serverVersion) {
            alert('Sorry, this client is out of date, please refresh this window.');
            throw new Error('Out of date');
          }
          console.log('Server version', this.serverVersion);
          this.isDead = false;
          this.lastXY = undefined;
          this.spectatorMode = false;
          this.playerEntityId = message.playerEntityId;
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
          const myScore = message.scores.find((a) => a.userId === this.playerEntityId);
          if (myScore) {
            this.myScore = myScore;
          }
          break;
        case 'pong':
          /*   if (!(message.ping in this.pings)) {
            throw new Error('Unmatched ping.');
          }
          const time = this.pings[message.ping];
          this.latency = +new Date() - time - GameConstants.serverTickRate;
          delete this.pings[message.ping];*/
          break;
        case 'worldState':
          this.totalPlayers = message.totalPlayers;
          const entityMap = Utils.toDictionary(message.entities, (a) => a.entityId);
          for (let i = this.game.entities.length - 1; i >= 0; i--) {
            const entity = this.game.entities.getIndex(i);
            assertType<Entity & ClientEntity>(entity);
            if (entity.clientDestroyedTick !== undefined) {
              entity.clientDestroyedTick--;
              if (entity.clientDestroyedTick <= 0) {
                entity.clientDestroyedTick = undefined;
              }
            }
            if (entityMap[entity.entityId]) {
              continue;
            }
            entity.destroy();
            this.game.entities.remove(entity);
          }

          for (const messageModel of message.entities) {
            let foundEntity = this.game.entities.lookup(messageModel.entityId);
            if (!foundEntity) {
              foundEntity = new ClientEntityTypes[messageModel.type](
                this.game,
                messageModel as WorldModelCastToEntityModel
              );
              this.game.entities.push(foundEntity);
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
    const pingInterval = setInterval(() => {
      /*
      if (!this.connected) {
        clearInterval(pingInterval);
        return;
      }
      this.pingIndex++;
      this.pings[this.pingIndex] = +new Date();
      this.socket.sendMessage({type: 'ping', ping: this.pingIndex});
*/
    }, GameConstants.pingInterval);
  }
}

export abstract class OrbitalClientEngine extends ClientEngine {}
