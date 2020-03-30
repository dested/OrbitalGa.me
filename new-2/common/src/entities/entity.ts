import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {ServerGame} from '../../../server/src/game/serverGame';
import {Utils} from '../utils/utils';
import {unreachable} from '../utils/unreachable';

export type PendingInput = {
  pressTime: number;
  inputSequenceNumber: number;
  left: boolean;
  shoot: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export type EntityTypes = 'player' | 'wall' | 'shot' | 'enemyShot' | 'swoopingEnemy';
export type EntityTypeOptions = {
  player: {};
  wall: {};
  shot: {x: number; y: number};
  enemyShot: {x: number; y: number};
  swoopingEnemy: {x: number; y: number; health: number};
};

export abstract class Entity {
  polygon?: Polygon;

  x: number = 0;
  y: number = 0;
  positionBuffer: {time: number; x: number; y: number}[] = [];
  constructor(protected game: Game, public entityId: string, public type: EntityTypes) {}

  start(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.updatePosition();
  }

  abstract createPolygon(): void;

  updatePosition() {
    if (!this.polygon) {
      return;
    }
    this.polygon.x = this.x;
    this.polygon.y = this.y;
  }

  markToDestroy: boolean = false;
  destroy() {
    if (this.polygon) {
      this.game.collisionEngine.remove(this.polygon!);
      this.polygon = undefined;
    }
    this.markToDestroy = true;
  }

  abstract collide(otherEntity: Entity, collisionResult: Result): boolean;

  checkCollisions() {
    if (!this.polygon) {
      return;
    }
    const potentials = this.polygon.potentials();
    for (const body of potentials) {
      if (this.polygon && this.polygon.collides(body, this.game.collisionResult)) {
        const collided = this.collide(body.entity, this.game.collisionResult);
        if (collided) {
          return true;
        }
      }
    }
    return false;
  }

  abstract tick(duration: number): void;
}

export class PlayerEntity extends Entity {
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

  tick(): void {
    this.shootTimer = Math.max(this.shootTimer - 1, 0);
  }

  lastProcessedInputSequenceNumber: number = -1;

  pendingInputs: PendingInput[] = [];
  inputSequenceNumber: number = 0;

  constructor(game: Game, entityId: string) {
    super(game, entityId, 'player');
    this.createPolygon();
  }

  speed = 200;

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
        console.log('hurt');
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

export class WallEntity extends Entity {
  createPolygon(): void {
    this.polygon = new Polygon(this.x, this.y, [
      [0, 0],
      [this.width, 0],
      [this.width, this.height],
      [0, this.height],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }
  tick(): void {}
  constructor(game: Game, entityId: string, public width: number, public height: number) {
    super(game, entityId, 'wall');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }
}
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
  constructor(game: Game, entityId: string, public health: number) {
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

export class ShotEntity extends Entity {
  createPolygon(): void {
    const h = 30;
    const w = 30;
    this.polygon = new Polygon(this.x, this.y, [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }
  constructor(game: Game, entityId: string) {
    super(game, entityId, 'shot');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.game.destroyEntity(this);
      return true;
    }
    return false;
  }

  shotSpeedPerSecond = 900;
  aliveDuration = 3000;
  tick(duration: number) {
    this.y -= this.shotSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    this.updatePosition();
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }
}

export class EnemyShotEntity extends Entity {
  createPolygon(): void {
    const h = 30;
    const w = 30;
    this.polygon = new Polygon(this.x, this.y, [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  constructor(game: Game, entityId: string) {
    super(game, entityId, 'enemyShot');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.game.destroyEntity(this);
      return true;
    }
    return false;
  }

  shotSpeedPerSecond = 900;
  aliveDuration = 3000;
  tick(duration: number) {
    this.y += this.shotSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    this.updatePosition();
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }
}
