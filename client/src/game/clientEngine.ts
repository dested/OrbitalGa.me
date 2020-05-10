import {unreachable} from '@common/utils/unreachable';
import {GameConstants} from '@common/game/gameConstants';
import {Game} from '@common/game/game';
import {assertType, Utils} from '@common/utils/utils';
import {ClientLivePlayerEntity} from './entities/clientLivePlayerEntity';
import {ClientEntityTypes} from './entities/clientEntityTypeModels';
import {SpectatorEntity} from '@common/entities/spectatorEntity';
import {STOCWorldState, WorldModelCastToEntityModel} from '@common/models/serverToClientMessages';
import {Entity} from '@common/entities/entity';
import {ClientEntity} from './entities/clientEntity';
import {RollingAverage} from '@common/utils/rollingAverage';
import {LeaderboardEntryRanked} from '@common/game/gameLeaderboard';
import {STOCError, ServerToClientMessage} from '@common/models/serverToClientMessages';
import {ClientToServerMessage} from '@common/models/clientToServerMessages';
import {PlayerEntity} from '@common/entities/playerEntity';
import {IClientSocket} from '../socket/IClientSocket';
import {Scheduler} from '@common/utils/scheduler';
import {ExtrapolateStrategy} from './synchronizer/extrapolateStrategy';

const STEP_DELAY_MSEC = 12; // if forward drift detected, delay next execution by this amount
const STEP_HURRY_MSEC = 8; // if backward drift detected, hurry next execution by this amount

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
  private scheduler?: Scheduler;
  private serverVersion: number = -1;
  private totalPlayers: number = 0;
  private synchronizer: ExtrapolateStrategy;

  constructor(
    private serverPath: string,
    public options: ClientGameOptions,
    public socket: IClientSocket,
    public game: Game
  ) {
    this.connect();
  }

  checkDrift(checkType: 'onServerSync' | 'onEveryStep') {
    if (!this.game.highestServerStep) return;

    const thresholds = this.synchronizer.syncStrategy.STEP_DRIFT_THRESHOLDS;
    const maxLead = thresholds[checkType].MAX_LEAD;
    const maxLag = thresholds[checkType].MAX_LAG;
    const clientStep = this.game.stepCount;
    const serverStep = this.game.highestServerStep;
    if (clientStep > serverStep + maxLead) {
      console.warn(
        `step drift ${checkType}. [${clientStep} > ${serverStep} + ${maxLead}] Client is ahead of server.  Delaying next step.`
      );
      if (this.scheduler) this.scheduler.delayTick();
      this.lastStepTime += STEP_DELAY_MSEC;
      this.correction += STEP_DELAY_MSEC;
    } else if (serverStep > clientStep + maxLag) {
      console.warn(
        `step drift ${checkType}. [${serverStep} > ${clientStep} + ${maxLag}] Client is behind server.  Hurrying next step.`
      );
      if (this.scheduler) this.scheduler.hurryTick();
      this.lastStepTime -= STEP_HURRY_MSEC;
      this.correction -= STEP_HURRY_MSEC;
    }
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

    this.init();
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

    this.game.step(0, duration);

    for (const entity of this.game.entities.array) {
      if (entity.markToDestroy) {
        assertType<Entity & ClientEntity>(entity);
        (entity as ClientEntity).destroyClient();
      }
    }
  }

  init() {
    this.synchronizer = new ExtrapolateStrategy(this);
    this.scheduler = new Scheduler({
      period: 1000 / 60,
      tick: this.step,
      delay: STEP_DELAY_MSEC,
    });
    this.scheduler!.start();
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

  step = (t: number, dt: number, physicsOnly: boolean) => {
    // physics only case
    if (physicsOnly) {
      this.game.step(false, t, dt, physicsOnly);
      return;
    }

    this.processMessages(this.messagesToProcess);
    this.messagesToProcess.length = 0;

    // check for server/client step drift without update
    this.checkDrift('onEveryStep');

    this.handleOutboundInput();

    this.game.step(false, t, dt);
    this.synchronizer.syncStep({dt});
    // this.game.emit('client__postStep', {dt});
  };

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

          if (!this.game.highestServerStep || message.stepCount > this.game.highestServerStep)
            this.game.highestServerStep = message.stepCount;

          this.processSync(message);

          this.checkDrift('onServerSync');
          break;
        default:
          unreachable(message);
          break;
      }
    }
  }

  private processSync(message: STOCWorldState) {
    this.synchronizer.collectSync(message);

    if (message.stepCount > this.game.stepCount + this.synchronizer.STEP_DRIFT_THRESHOLDS.clientReset) {
      console.log(
        `========== world step count updated from ${this.game.stepCount} to  ${message.stepCount} ==========`
      );
      this.game.emit('client__stepReset', {
        oldStep: this.game.stepCount,
        newStep: message.stepCount,
      });
      this.game.stepCount = message.stepCount;
    }
  }
}

export abstract class OrbitalClientEngine extends ClientEngine {}
