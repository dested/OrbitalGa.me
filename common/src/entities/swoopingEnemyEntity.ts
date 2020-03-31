import {Polygon, Result} from 'collisions';
import {Utils} from '../utils/utils';
import {unreachable} from '../utils/unreachable';
import {Game} from '../game/game';
import {Entity} from './entity';
import {ShotEntity} from './shotEntity';

export class SwoopingEnemyEntity extends Entity {
  startX?: number;
  startY?: number;

  setStartPosition(x: number, y: number) {
    this.startX = x;
    this.startY = y;
  }

  createPolygon(): void {
    const w = 30;
    const h = 30;
    this.polygon = new Polygon(this.x, this.y, [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  paths = [
    {x: 0, y: 0},
    {x: -20, y: 50 * 3},
    {x: -40, y: 100 * 3},
    {x: -20, y: 150 * 3},
    {x: 0, y: 200 * 3},
    {x: 20, y: 175 * 3},
    {x: 40, y: 150 * 3},
  ];
  swaddle = [
    {x: 0, y: -50},
    {x: 0, y: +50},
    {x: 0, y: -50},
  ];

  pathTick = 0;
  pathIndex = 1;

  step: 'path' | 'swaddle' | 'swoop-off' = 'path';
  aliveTick = 0;
  swoopDirection: 'left' | 'right' = Utils.flipCoin('left', 'right');

  tick(): void {
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
      this.game.createEntity('enemyShot', {x: this.x, y: this.y});
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
          this.x = Utils.lerp(this.startX!, this.swoopDirection === 'left' ? -100 : 2000, this.pathTick / pathDuration);
          this.y = Utils.lerp(this.startY!, -100, this.pathTick / pathDuration);

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
      return true;
    }
    return false;
  }
}
