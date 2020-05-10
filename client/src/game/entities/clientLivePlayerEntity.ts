import {LivePlayerModel, PlayerInput, PlayerModel} from '@common/entities/playerEntity';
import {assertType, Utils} from '@common/utils/utils';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {GameConstants, GameDebug} from '@common/game/gameConstants';
import {OrbitalAssets} from '../../utils/assetManager';
import {unreachable} from '@common/utils/unreachable';
import {OrbitalGame} from '@common/game/game';

type KeyInput = Omit<PlayerInput, 'inputSequenceNumber'>;

export class ClientLivePlayerEntity extends ClientPlayerEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  inputSequenceNumber: number = 1;
  keys: KeyInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    weapon: 'unset',
  };

  mainTick = 0;

  positionLerp: {duration: number; startTime: number; x: number; y: number} = {
    x: this.x,
    y: this.y,
    startTime: +new Date(),
    duration: GameConstants.serverTickRate,
  };
  zIndex = DrawZIndex.Player;
  constructor(clientGame: OrbitalGame, public messageModel: LivePlayerModel) {
    super(clientGame, messageModel);
    this.lastProcessedInputSequenceNumber = messageModel.lastProcessedInputSequenceNumber;
  }

  get drawX(): number {
    const {x, y, startTime, duration} = this.positionLerp;
    const now = +new Date();
    if ((now - startTime) / duration >= 1) {
      return Math.round(this.x);
    } else {
      return Math.round(Utils.lerp(x, this.x, (now - startTime) / duration));
    }
  }

  get drawY(): number {
    const {x, y, startTime, duration} = this.positionLerp;
    const now = +new Date();
    if ((now - startTime) / duration >= 1) {
      return Math.round(this.y);
    } else {
      return Math.round(Utils.lerp(y, this.y, (now - startTime) / duration));
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    if (GameDebug.client) {
      context.save();
      context.font = '20px kenney_spaceregular';
      context.strokeStyle = '#f0f0f0';
      context.strokeText(this.playersToLeft.toString(), this.drawX - 100, this.drawY);
      context.fillStyle = '#49d7b8';
      context.fillText(this.playersToLeft.toString(), this.drawX - 100, this.drawY);

      context.strokeStyle = '#f0f0f0';
      context.strokeText(this.playersToRight.toString(), this.drawX + 100, this.drawY);
      context.fillStyle = '#49d7b8';
      context.fillText(this.playersToRight.toString(), this.drawX + 100, this.drawY);

      context.restore();
    }
  }

  gameTick(duration: number): void {
    this.positionLerp.x = this.x;
    this.positionLerp.y = this.y;
    this.positionLerp.startTime = +new Date();
    this.positionLerp.duration = duration;
    super.gameTick(duration);
  }

  interpolateEntity(renderTimestamp: number) {
    // live entity does not need to interpolate anything
  }

  processInput(duration: number) {
    const weaponChanged = this.keys.weapon !== 'unset';
    this.xInputsThisTick = false;
    this.yInputsThisTick = false;
    this.applyInput(this.keys, this.inputSequenceNumber);
    if (this.keys.shoot || this.keys.left || this.keys.right || this.keys.up || this.keys.down || weaponChanged) {
      this.clientGame.sendInput(this.keys, this.inputSequenceNumber);
    }
    this.keys.weapon = 'unset';
  }

  reconcileFromServer(messageModel: LivePlayerModel | PlayerModel) {
    assertType<LivePlayerModel>(messageModel);
    const wasHit = this.hit;
    super.reconcileFromServerLive(messageModel);

    if (this.hit !== wasHit) {
      this.hitTimer = 5;
    }

    if (this.dead) {
      this.clientGame.died();
    }
  }

  setKey<Key extends keyof KeyInput>(input: Key, value: KeyInput[Key]) {
    this.keys[input] = value;
  }

  staticDraw(context: CanvasRenderingContext2D) {
    const totalCount = this.game.totalPlayers;
    if (this.playersToLeft > this.playersToRight && this.playersToLeft > totalCount * 0.6) {
      const dx = GameConstants.screenSize.width * 0.1 + Math.cos(this.mainTick / 10) * 50;
      context.drawImage(
        OrbitalAssets.assets['Arrows.arrowLeft'].image,
        dx,
        GameConstants.screenSize.height * 0.5,
        GameConstants.screenSize.height * 0.15,
        GameConstants.screenSize.height * 0.15
      );
    }
    if (this.playersToRight > this.playersToLeft && this.playersToRight > totalCount * 0.6) {
      const dx = GameConstants.screenSize.width * 0.9 - +Math.cos(this.mainTick / 10) * 50;
      context.drawImage(
        OrbitalAssets.assets['Arrows.arrowRight'].image,
        dx,
        GameConstants.screenSize.height * 0.5,
        GameConstants.screenSize.height * 0.15,
        GameConstants.screenSize.height * 0.15
      );
    }
  }
  tick() {
    this.mainTick++;
  }
}
