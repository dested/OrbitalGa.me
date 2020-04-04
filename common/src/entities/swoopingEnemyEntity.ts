import {Polygon, Result} from 'collisions';
import {Utils} from '../utils/utils';
import {unreachable} from '../utils/unreachable';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ShotEntity} from './shotEntity';
import {GameConstants} from '../game/gameConstants';
import {ShotExplosionEntity} from './shotExplosionEntity';
import {nextId} from '../utils/uuid';
import {EnemyShotEntity} from './enemyShotEntity';

export class SwoopingEnemyEntity extends Entity {
  boundingBox = {width: 127, height: 75};

  startX?: number;
  startY?: number;

  setStartPosition(x: number, y: number) {
    this.startX = x;
    this.startY = y;
  }

  paths = [
    {x: 0, y: 0},
    {x: -GameConstants.screenSize.width * 0.1, y: GameConstants.screenSize.height * 0.4},
    {x: -GameConstants.screenSize.width * 0.2, y: GameConstants.screenSize.height * 0.5},
    {x: -GameConstants.screenSize.width * 0.1, y: GameConstants.screenSize.height * 0.5},
    {x: 0, y: GameConstants.screenSize.height * 0.4},
    {x: GameConstants.screenSize.width * 0.1, y: GameConstants.screenSize.height * 0.6},
    {x: GameConstants.screenSize.width * 0.2, y: GameConstants.screenSize.height * 0.5},
  ];

  swaddle = [
    {x: 0, y: GameConstants.screenSize.height * 0.1},
    {x: 0, y: -GameConstants.screenSize.height * 0.1},
    {x: 0, y: GameConstants.screenSize.height * 0.1},
  ];

  pathTick = 0;
  pathIndex = 1;

  step: 'path' | 'swaddle' | 'swoop-off' = 'path';
  aliveTick = 0;
  swoopDirection: 'left' | 'right' = Utils.flipCoin('left', 'right');

  tick(duration: number): void {
    this.aliveTick++;
    if (this.health <= 0) {
      this.game.destroyEntity(this);
    }
    if (this.aliveTick === 70) {
      this.step = 'swoop-off';
      this.startX = this.x;
      this.startY = this.y;
      this.pathTick = 0;
    }

    if (this.aliveTick % 4 === 0) {
      const shotEntity = new EnemyShotEntity(this.game, nextId(), this.y);
      shotEntity.start(this.x, this.y);
      shotEntity.tick(duration);
      this.game.entities.push(shotEntity);
    }

    switch (this.step) {
      case 'path':
        {
          const pathDuration = 5;
          this.x =
            Utils.lerp(this.paths[this.pathIndex - 1].x, this.paths[this.pathIndex].x, this.pathTick / pathDuration) +
            this.startX!;
          this.y =
            Utils.lerp(this.paths[this.pathIndex - 1].y, this.paths[this.pathIndex].y, this.pathTick / pathDuration) +
            this.startY!;

          this.pathTick++;
          if (this.pathTick % pathDuration === 0) {
            this.pathIndex++;
            this.pathTick = 0;
            if (this.pathIndex >= this.paths.length) {
              this.pathIndex = 1;
              this.step = 'swaddle';
              this.startX = this.x;
              this.startY = this.y;
            }
          }
        }
        break;
      case 'swaddle':
        {
          const pathDuration = 5;
          this.x =
            Utils.lerp(
              this.swaddle[this.pathIndex - 1].x,
              this.swaddle[this.pathIndex].x,
              this.pathTick / pathDuration
            ) + this.startX!;
          this.y =
            Utils.lerp(
              this.swaddle[this.pathIndex - 1].y,
              this.swaddle[this.pathIndex].y,
              this.pathTick / pathDuration
            ) + this.startY!;

          this.pathTick++;
          if (this.pathTick % pathDuration === 0) {
            this.pathIndex++;
            this.pathTick = 0;
            if (this.pathIndex >= this.swaddle.length) {
              this.pathIndex = 1;
            }
          }
        }
        break;
      case 'swoop-off':
        {
          const pathDuration = 15;
          this.x = Utils.lerp(
            this.startX!,
            this.swoopDirection === 'left'
              ? this.startX! - GameConstants.screenSize.width * 2
              : this.startX! + GameConstants.screenSize.width * 2,
            this.pathTick / pathDuration
          );
          this.y = Utils.lerp(this.startY!, -GameConstants.screenSize.height * 0.1, this.pathTick / pathDuration);

          this.pathTick++;
          if (this.pathTick % pathDuration === 0) {
            this.game.destroyEntity(this);
          }
        }
        break;

      default:
        unreachable(this.step);
    }

    this.updatePosition();
  }

  constructor(game: Game, entityId: number, public health: number) {
    super(game, entityId, 'swoopingEnemy');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof ShotEntity) {
      this.health -= 1;
      this.game.destroyEntity(otherEntity);

      const shotExplosionEntity = new ShotExplosionEntity(this.game, nextId(), this.entityId);
      shotExplosionEntity.start(
        this.x - (otherEntity.x + otherEntity.shotOffsetX),
        this.y - (otherEntity.y + otherEntity.shotOffsetY)
      );
      this.game.entities.push(shotExplosionEntity);

      return true;
    }
    return false;
  }
  serialize(): SwoopingEnemyModel {
    return {
      ...super.serialize(),
      health: this.health,
      entityType: 'swoopingEnemy',
    };
  }
}

export type SwoopingEnemyModel = EntityModel & {
  entityType: 'swoopingEnemy';
  health: number;
};
