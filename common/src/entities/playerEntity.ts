import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {unreachable} from '../utils/unreachable';
import {Entity} from './entity';
import {GameConstants} from '../game/gameConstants';

export type PendingInput = {
  pressTime: number;
  inputSequenceNumber: number;
  left: boolean;
  shoot: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export class PlayerEntity extends Entity {
  boundingBox = {width: 99, height: 75};

  tick(): void {
    this.shootTimer = Math.max(this.shootTimer - 1, 0);
  }

  lastProcessedInputSequenceNumber: number = -1;

  pendingInputs: PendingInput[] = [];
  inputSequenceNumber: number = 0;

  constructor(game: Game, entityId: number) {
    super(game, entityId, 'player');
    this.createPolygon();
  }

  speed = 500;

  shootTimer: number = 1;

  applyInput(input: PendingInput) {
    if (input.shoot) {
      if (!this.game.isClient) {
        if (this.shootTimer <= 0) {
          this.game.createEntity('shot', {x: this.x, y: this.y});
          this.shootTimer = 1;
        }
      }
    }
    if (input.left) {
      this.x -= input.pressTime * this.speed;
    }
    if (input.right) {
      this.x += input.pressTime * this.speed;
    }
    if (input.up) {
      this.y -= input.pressTime * this.speed;
    }
    if (input.down) {
      this.y += input.pressTime * this.speed;
    }

    const {x0, x1} = this.game.getPlayerRange(1000, (entity) => this !== entity);
    if (this.x < x0) {
      this.x = x0;
    }
    if (this.x > x1) {
      this.x = x1;
    }

    if (this.y < GameConstants.screenSize.height * 0.1) {
      this.y = GameConstants.screenSize.height * 0.1;
    }
    if (this.y > GameConstants.screenSize.height * 1.1) {
      this.y = GameConstants.screenSize.height * 1.1;
    }
    this.updatePosition();
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

      default:
        unreachable(otherEntity.type);
        return false;
    }
  }
}
