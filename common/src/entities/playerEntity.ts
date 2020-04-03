import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {unreachable} from '../utils/unreachable';
import {Entity} from './entity';
import {GameConstants} from '../game/gameConstants';

export type PendingInput = {
  inputSequenceNumber: number;
  left: boolean;
  shoot: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export class PlayerEntity extends Entity {
  boundingBox = {width: 99, height: 75};
  xInputsThisTick: boolean = false;
  yInputsThisTick: boolean = false;

  tick(): void {
    this.shootTimer = Math.max(this.shootTimer - 1, 0);
    this.updatedPositionFromMomentum();
  }

  lastProcessedInputSequenceNumber: number = -1;

  pendingInputs: PendingInput[] = [];
  inputSequenceNumber: number = 0;

  constructor(game: Game, entityId: number) {
    super(game, entityId, 'player');
    this.createPolygon();
  }

  maxSpeed = 90;
  momentum: {x: number; y: number} = {x: 0, y: 0};

  shootTimer: number = 1;

  shotSide: 'left' | 'right' = 'left';

  applyInput(input: PendingInput) {
    if (input.shoot) {
      if (!this.game.isClient) {
        if (this.shootTimer <= 0) {
          this.game.createEntity('shot', {
            x: this.x,
            y: this.y,
            ownerEntityId: this.entityId,
            shotOffsetX: this.shotSide === 'left' ? -42 : 42,
            shotOffsetY: -6,
          });
          this.shotSide = this.shotSide === 'left' ? 'right' : 'left';
          this.shootTimer = 1;
        }
      }
    }

    const ramp = 30;
    if (input.left) {
      this.xInputsThisTick = true;
      this.momentum.x -= ramp;
      if (this.momentum.x < -this.maxSpeed) {
        this.momentum.x = -this.maxSpeed;
      }
    }
    if (input.right) {
      this.xInputsThisTick = true;
      this.momentum.x += ramp;
      if (this.momentum.x > this.maxSpeed) {
        this.momentum.x = this.maxSpeed;
      }
    }
    if (input.up) {
      this.yInputsThisTick = true;
      this.momentum.y -= ramp;
      if (this.momentum.y < -this.maxSpeed) {
        this.momentum.y = -this.maxSpeed;
      }
    }
    if (input.down) {
      this.yInputsThisTick = true;
      this.momentum.y += ramp;
      if (this.momentum.y > this.maxSpeed) {
        this.momentum.y = this.maxSpeed;
      }
    }
  }

  destroy(): void {
    super.destroy();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    switch (otherEntity.type) {
      case 'player':
        /*this.x -= collisionResult.overlap * collisionResult.overlap_x;
        this.y -= collisionResult.overlap * collisionResult.overlap_y;
        this.updatePosition();
        return true;*/
        return false;
      case 'wall':
        this.x -= collisionResult.overlap * collisionResult.overlap_x;
        this.y -= collisionResult.overlap * collisionResult.overlap_y;
        this.updatePosition();
        return true;
      case 'shot':
        // console.log('shot');
        return false;
      case 'enemyShot':
        // console.log('hurt');
        return false;
      case 'swoopingEnemy':
        // console.log('shot');
        return false;
      case 'shotExplosion':
        // console.log('shot');
        return false;
      default:
        unreachable(otherEntity.type);
        return false;
    }
  }

  updatedPositionFromMomentum() {
    this.x += this.momentum.x;
    this.y += this.momentum.y;

    if (!this.xInputsThisTick) {
      this.momentum.x = this.momentum.x * 0.5;
    }
    if (!this.yInputsThisTick) {
      this.momentum.y = this.momentum.y * 0.5;
    }
    if (Math.abs(this.momentum.x) < 3) {
      this.momentum.x = 0;
    }
    if (Math.abs(this.momentum.y) < 3) {
      this.momentum.y = 0;
    }

    const {x0, x1} = this.game.getPlayerRange(1000, (entity) => this !== entity);
    if (this.x < x0) {
      this.x = x0;
      this.momentum.x = 0;
    }
    if (this.x > x1) {
      this.x = x1;
      this.momentum.x = 0;
    }

    if (this.y < GameConstants.screenSize.height * 0.1) {
      this.y = GameConstants.screenSize.height * 0.1;
      this.momentum.y = 0;
    }
    if (this.y > GameConstants.screenSize.height * 1.1) {
      this.y = GameConstants.screenSize.height * 1.1;
      this.momentum.y = 0;
    }
    // console.log(this.momentum.x, this.momentum.y, this.x, this.y);

    this.updatePosition();
  }
}
