import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';

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

  abstract boundingBox: {width: number; height: number};

  x: number = 0;
  y: number = 0;
  positionBuffer: {time: number; x: number; y: number}[] = [];
  constructor(protected game: Game, public entityId: number, public type: EntityTypes) {}

  start(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.updatePosition();
  }

  createPolygon(): void {
    this.polygon = new Polygon(this.x, this.y, [
      [-this.boundingBox.width / 2, -this.boundingBox.height / 2],
      [this.boundingBox.width / 2, -this.boundingBox.height / 2],
      [this.boundingBox.width / 2, this.boundingBox.height / 2],
      [-this.boundingBox.width / 2, this.boundingBox.height / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

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
