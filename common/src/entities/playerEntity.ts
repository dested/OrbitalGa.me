import {Result} from 'collisions';
import {Game} from '../game/game';
import {unreachable} from '../utils/unreachable';
import {Entity, EntityModel} from './entity';
import {GameConstants} from '../game/gameConstants';
import {ShotEntity} from './shotEntity';
import {nextId} from '../utils/uuid';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {WallEntity} from './wallEntity';
import {EnemyShotEntity} from './enemyShotEntity';
import {ShotExplosionEntity} from './shotExplosionEntity';

export type PendingInput = {
  inputSequenceNumber: number;
  left: boolean;
  shoot: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export class PlayerEntity extends Entity {
  get realX() {
    return this.x;
  }
  get realY() {
    return this.y;
  }

  boundingBoxes = [{width: 99, height: 75}];
  xInputsThisTick: boolean = false;
  yInputsThisTick: boolean = false;

  constructor(game: Game, entityId: number) {
    super(game, entityId, 'player');
    this.createPolygon();
  }

  gameTick(): void {
    this.shootTimer = Math.max(this.shootTimer - 1, 0);
    this.updatedPositionFromMomentum();
  }

  lastProcessedInputSequenceNumber: number = 0;

  pendingInputs: PendingInput[] = [];
  inputSequenceNumber: number = 1;

  maxSpeed = 90;
  momentum: {x: number; y: number} = {x: 0, y: 0};

  shootTimer: number = 1;

  shotSide: 'left' | 'right' = 'left';

  applyInput(input: PendingInput) {
    this.xInputsThisTick = false;
    this.yInputsThisTick = false;

    if (input.shoot) {
      if (!this.game.isClient) {
        if (this.shootTimer <= 0) {
          const shotEntity = new ShotEntity(this.game, nextId(), this.entityId);
          shotEntity.start(this.shotSide === 'left' ? -42 : 42, -6);
          this.game.entities.push(shotEntity);
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

  static startingHealth = 50;
  health = PlayerEntity.startingHealth;

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.x -= collisionResult.overlap * collisionResult.overlap_x;
      this.y -= collisionResult.overlap * collisionResult.overlap_y;
      this.updatePolygon();
      return true;
    }
    /*
    if (otherEntity instanceof EnemyShotEntity) {
      this.health -= 1;
      this.game.destroyEntity(otherEntity);
      const shotExplosionEntity = new ShotExplosionEntity(this.game, nextId(), this.entityId);
      shotExplosionEntity.start(
        this.realX - otherEntity.realX /!* + otherEntity.shotOffsetX*!/,
        this.realY - otherEntity.realY /!* + otherEntity.shotOffsetY*!/
      );
      this.game.entities.push(shotExplosionEntity);

      return true;
    }
*/
    return false;
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
  }

  serialize(): PlayerModel {
    return {
      ...super.serialize(),
      momentumX: this.momentum.x,
      momentumY: this.momentum.y,
      lastProcessedInputSequenceNumber: this.lastProcessedInputSequenceNumber,
      entityType: 'player',
    };
  }

  static readBuffer(reader: ArrayBufferReader): PlayerModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'player',
      momentumX: reader.readFloat32(),
      momentumY: reader.readFloat32(),
      lastProcessedInputSequenceNumber: reader.readUint32(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: PlayerModel) {
    Entity.addBuffer(buff, entity);
    buff.addFloat32(entity.momentumX);
    buff.addFloat32(entity.momentumY);
    buff.addUint32(entity.lastProcessedInputSequenceNumber);
  }
}

export type PlayerModel = EntityModel & {
  entityType: 'player';
  lastProcessedInputSequenceNumber: number;
  momentumX: number;
  momentumY: number;
};
