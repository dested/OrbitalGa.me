import {unreachable} from '@common/utils/unreachable';
import {GameConstants} from '@common/game/gameConstants';
import {Engine, Game} from '@common/game/game';
import {STOCWorldState} from '@common/models/serverToClientMessages';
import {LeaderboardEntryRanked} from '@common/game/gameLeaderboard';
import {STOCError, ServerToClientMessage} from '@common/models/serverToClientMessages';
import {ClientToServerMessage, CTOSPlayerInput} from '@common/models/clientToServerMessages';
import {PlayerEntity, PlayerInputKeys} from '@common/entities/playerEntity';
import {IClientSocket} from '../socket/IClientSocket';
import {Scheduler} from '@common/utils/scheduler';
import {ExtrapolateStrategy} from './synchronizer/extrapolateStrategy';
import {Entity} from '@common/baseEntities/entity';
import {ActorEntityTypes} from './entities/entityTypeModels';
import {TwoVectorModel} from '@common/utils/twoVector';

const STEP_DELAY_MSEC = 12; // if forward drift detected, delay next execution by this amount
const STEP_HURRY_MSEC = 8; // if backward drift detected, hurry next execution by this amount
const TIME_RESET_THRESHOLD = 100;

export type ClientGameOptions = {
  onDied: (me: ClientEngine) => void;
  onDisconnect: (me: ClientEngine) => void;
  onError: (client: ClientEngine, error: STOCError) => void;
  onOpen: (me: ClientEngine) => void;
  onReady: (me: ClientEngine) => void;
  onUIUpdate: (me: ClientEngine) => void;
};

export class ClientEngine extends Engine {
  debugValues: {[key: string]: number | string} = {};
  isDead: boolean = false;
  keys: PlayerInputKeys = {up: false, down: false, left: false, right: false, shoot: false};
  lastXY?: TwoVectorModel;
  latency: number = 0;
  leaderboardScores: LeaderboardEntryRanked[] = [];
  myScore?: LeaderboardEntryRanked;
  pingIndex = 0;
  pings: {[pingIndex: number]: number} = {};
  spectatorMode: boolean = false;

  private connected = false;
  private correction: number = 0;
  private doReset: boolean = false;
  private lastStepTime: number = 0;
  private messageIndex: number = 1;
  private messagesToProcess: ServerToClientMessage[] = [];
  private scheduler?: Scheduler;
  private serverVersion: number = -1;
  private synchronizer: ExtrapolateStrategy;
  private totalPlayers: number = 0;

  constructor(
    private serverPath: string,
    public options: ClientGameOptions,
    public socket: IClientSocket,
    public game: Game
  ) {
    super();
    game.setEngine(this);
    this.synchronizer = new ExtrapolateStrategy(this);
    this.connect();
  }

  assignActor(entity: Entity): void {
    entity.actor = new ActorEntityTypes[entity.type](this, entity as any);
  }

  checkDrift(checkType: 'onServerSync' | 'onEveryStep') {
    if (!this.game.highestServerStep) return;

    const thresholds = this.synchronizer.STEP_DRIFT_THRESHOLDS;
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

  clientDied() {
    if (!this.isDead) {
      this.isDead = true;
      this.lastXY = this.game.clientPlayer?.position;
      this.game.clientPlayerId = undefined;
      this.options.onDied(this);
    }
  }

  clientStep = () => {
    if (!this.socket.isConnected()) return;
    const t = +new Date();
    const p = 1000 / 60;
    let dt = 0;
    // reset step time if we passed a threshold
    if (this.doReset || t > this.lastStepTime + TIME_RESET_THRESHOLD) {
      this.doReset = false;
      this.lastStepTime = t - p / 2;
      this.correction = p / 2;
    }

    // catch-up missed steps
    while (t > this.lastStepTime + p) {
      this.step(this.lastStepTime + p, p + this.correction, false);
      this.lastStepTime += p;
      this.correction = 0;
    }

    // if not ready for a real step yet, return
    // this might happen after catch up above
    if (t < this.lastStepTime) {
      dt = t - this.lastStepTime + this.correction;
      if (dt < 0) dt = 0;
      this.correction = this.lastStepTime - t;
      this.step(t, dt, true);
      return;
    }

    // render-controlled step
    dt = t - this.lastStepTime + this.correction;
    this.lastStepTime += p;
    this.correction = this.lastStepTime - t;
    this.step(t, dt, false);
  };

  connect() {
    this.connected = true;
    this.socket.connect(this.serverPath, {
      onOpen: () => {
        this.options.onOpen(this);
      },
      onDisconnect: () => {
        this.options.onDisconnect(this);
        this.scheduler?.stop();
        this.connected = false;
      },
      onMessage: (messages) => {
        this.messagesToProcess.push(...messages);
      },
    });

    this.init();
  }

  disconnect() {
    this.socket.disconnect();
  }

  init() {
    this.scheduler = new Scheduler({
      period: 1000 / 60,
      tick: this.clientStep,
      delay: STEP_DELAY_MSEC,
    });
    this.scheduler!.start();

    const pingInterval = setInterval(() => {
      if (!this.connected) {
        clearInterval(pingInterval);
        return;
      }
      this.pingIndex++;
      this.pings[this.pingIndex] = +new Date();
      if (this.socket.isConnected()) this.socket.sendMessage({type: 'ping', ping: this.pingIndex});
    }, GameConstants.pingInterval);
    setInterval(() => {
      this.options?.onUIUpdate(this);
    }, 500);
  }

  joinGame() {
    this.lastXY = undefined;
    this.sendMessageToServer({type: 'join'});
  }

  killPlayer(player: PlayerEntity): void {}

  sendMessageToServer(message: ClientToServerMessage) {
    this.socket.sendMessage(message);
  }

  setDebug(key: string, value: number | string) {
    this.debugValues[key] = value;
  }

  setKey<Key extends keyof PlayerInputKeys>(input: Key, value: PlayerInputKeys[Key]) {
    this.keys[input] = value;
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
      this.game.step(false, dt, true);
      return;
    }
    this.handleKeys();

    this.processMessages();

    // check for server/client step drift without update
    this.checkDrift('onEveryStep');

    this.game.step(false, dt, false);
    this.synchronizer.syncStep({dt});
    for (const entity of this.game.entities.array) {
      if (entity.markToDestroy) {
        entity.actor?.destroyClient();
      }
    }
  };

  private handleKeys() {
    const keys = {...this.keys};
    if (keys.up || keys.right || keys.left || keys.down || keys.shoot) {
      if (!this.game.clientPlayer?.canShoot) {
        keys.shoot = false;
      }
      const inputEvent: CTOSPlayerInput = {
        type: 'playerInput',
        messageIndex: this.messageIndex,
        step: this.game.stepCount,
        weapon: 'unset', // todo weapon
        keys,
        movement: keys.up || keys.right || keys.left || keys.down,
      };
      this.synchronizer.clientInputSave(inputEvent);
      this.game.processInput(inputEvent, this.game.clientPlayerId!);
      this.sendMessageToServer(inputEvent);
      this.messageIndex++;
    }
  }

  private processMessages() {
    for (const message of this.messagesToProcess) {
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
          this.game.highestServerStep = message.stepCount;
          this.game.stepCount = message.stepCount;
          this.game.clientPlayerId = message.playerEntityId;
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
          const myScore = message.scores.find((a) => a.userId === this.game.clientPlayerId);
          if (myScore) {
            this.myScore = myScore;
          }
          break;
        case 'pong':
          if (!(message.ping in this.pings)) {
            throw new Error('Unmatched ping.');
          }
          const time = this.pings[message.ping];
          this.latency = +new Date() - time - GameConstants.serverTickRate;
          delete this.pings[message.ping];
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
    this.messagesToProcess.length = 0;
  }

  private processSync(message: STOCWorldState) {
    this.synchronizer.collectSync(message);

    if (message.stepCount > this.game.stepCount + this.synchronizer.STEP_DRIFT_THRESHOLDS.clientReset) {
      console.log(
        `========== world step count updated from ${this.game.stepCount} to  ${message.stepCount} ==========`
      );
      this.doReset = true;
      this.game.stepCount = message.stepCount;
    }
  }
}

export abstract class OrbitalClientEngine extends ClientEngine {}
