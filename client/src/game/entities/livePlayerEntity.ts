import {PlayerEntity, PlayerModel} from '@common/entities/playerEntity';
import {Game} from '@common/game/game';
import {Utils} from '@common/utils/utils';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';

export class LivePlayerEntity extends PlayerEntity implements ClientEntity {
  zIndex = DrawZIndex.Player;
  constructor(game: Game, public entityId: number) {
    super(game, entityId);
  }

  positionLerp?: {startTime: number; duration: number; x: number; y: number};

  gameTick(): void {
    super.gameTick();
  }

  keys = {up: false, down: false, left: false, right: false, shoot: false};

  pressKey(input: keyof LivePlayerEntity['keys']) {
    this.keys[input] = true;
  }

  releaseKey(input: keyof LivePlayerEntity['keys']) {
    this.keys[input] = false;
  }

  clearKeys() {
    for (const key of Utils.safeKeys(this.keys)) {
      this.keys[key] = false;
    }
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
    const ship = AssetManager.assets.ship1;
    context.drawImage(ship.image, this.drawX - ship.size.width / 2, this.drawY - ship.size.height / 2);
  }

  reconcileFromServer(messageEntity: PlayerModel) {
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.momentum.x = messageEntity.momentumX;
    this.momentum.y = messageEntity.momentumY;
    for (let i = this.pendingInputs.length - 1; i >= 0; i--) {
      const input = this.pendingInputs[i];
      if (input.inputSequenceNumber <= messageEntity.lastProcessedInputSequenceNumber) {
        this.pendingInputs.splice(i, 1);
      } else {
        this.applyInput(input);
        this.updatedPositionFromMomentum();
      }
    }
  }
}
