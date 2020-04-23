import {LivePlayerModel, PlayerInput, PlayerModel} from '@common/entities/playerEntity';
import {assertType, Utils} from '@common/utils/utils';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {GameConstants} from '@common/game/gameConstants';
import {OrbitalAssets} from '../../utils/assetManager';

type KeyInput = Omit<PlayerInput, 'inputSequenceNumber'>;

export class ClientLivePlayerEntity extends ClientPlayerEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  keys: KeyInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    weapon: 'unset',
  };

  mainTick = 0;

  positionLerp?: {duration: number; startTime: number; x: number; y: number};
  zIndex = DrawZIndex.Player;
  constructor(clientGame: ClientGame, public messageModel: LivePlayerModel) {
    super(clientGame, messageModel);
    this.lastProcessedInputSequenceNumber = messageModel.lastProcessedInputSequenceNumber;
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

  draw(context: CanvasRenderingContext2D): void {
    super.draw(context);

    if (GameConstants.debugClient) {
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

  gameTick(): void {
    super.gameTick();
  }

  interpolateEntity(renderTimestamp: number) {
    // live entity does not need to interpolate anything
  }

  processInput(duration: number) {
    if (!this.positionLerp) {
      this.positionLerp = {
        x: this.x,
        y: this.y,
        startTime: +new Date(),
        duration,
      };
    } else {
      this.positionLerp.x = this.x;
      this.positionLerp.y = this.y;
      this.positionLerp.startTime = +new Date();
      this.positionLerp.duration = duration;
    }

    const input = {
      ...this.keys,
      inputSequenceNumber: this.inputSequenceNumber++,
    };

    this.pendingInputs.push(input);
    const weaponChanged = !!this.keys.weapon;
    this.applyInput(input);

    if (this.keys.shoot || this.keys.left || this.keys.right || this.keys.up || this.keys.down || weaponChanged) {
      this.clientGame.sendInput(input, input.inputSequenceNumber);
    }
    this.keys.weapon = 'unset';
  }

  reconcileFromServer(messageModel: LivePlayerModel | PlayerModel) {
    assertType<LivePlayerModel>(messageModel);
    const wasHit = this.hit;
    super.reconcileFromServerLive(messageModel);
    if (this.hit !== wasHit) {
      console.log('HIT', +new Date());
      this.hitTimer = 5;
    }

    if (this.dead) {
      this.clientGame.died();
    }
    let spliceIndex = -1;
    for (let i = 0; i < this.pendingInputs.length; i++) {
      const input = this.pendingInputs[i];
      if (input.inputSequenceNumber <= messageModel.lastProcessedInputSequenceNumber) {
        spliceIndex = i;
      } else {
        this.applyInput(input);
        this.updatedPositionFromMomentum();
      }
    }
    if (spliceIndex >= 0) {
      this.pendingInputs.splice(0, spliceIndex + 1);
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
