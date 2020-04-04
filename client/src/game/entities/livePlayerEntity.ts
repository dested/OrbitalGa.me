import {PlayerEntity} from '@common/entities/playerEntity';
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

  tick(): void {
    super.tick();
  }

  keys = {up: false, down: false, left: false, right: false, shoot: false};

  pressUp() {
    this.keys.up = true;
  }

  pressShoot() {
    this.keys.shoot = true;
  }

  pressDown() {
    this.keys.down = true;
  }

  pressLeft() {
    this.keys.left = true;
  }

  pressRight() {
    this.keys.right = true;
  }

  releaseUp() {
    this.keys.up = false;
  }

  releaseShoot() {
    this.keys.shoot = false;
  }

  releaseDown() {
    this.keys.down = false;
  }

  releaseLeft() {
    this.keys.left = false;
  }

  releaseRight() {
    this.keys.right = false;
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
}
