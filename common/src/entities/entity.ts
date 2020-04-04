import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {WorldStateEntity} from '../models/messages';

export abstract class Entity {
  polygon?: Polygon;

  abstract boundingBox: {width: number; height: number};

  get realX() {
    return this.x;
  }
  get realY() {
    return this.y;
  }

  x: number = 0;
  y: number = 0;
  entityId: number;
  create: boolean = true;

  positionBuffer: {time: number; x: number; y: number}[] = [];
  constructor(protected game: Game, entityId: number, public type: WorldStateEntity['entityType']) {
    this.entityId = entityId;
  }

  start(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.updatePosition();
  }

  createPolygon(x: number = this.x, y: number = this.y): void {
    if (this.boundingBox.width === 0 && this.boundingBox.height === 0) {
      return;
    }
    this.polygon = new Polygon(x, y, [
      [-this.boundingBox.width / 2, -this.boundingBox.height / 2],
      [this.boundingBox.width / 2, -this.boundingBox.height / 2],
      [this.boundingBox.width / 2, this.boundingBox.height / 2],
      [-this.boundingBox.width / 2, this.boundingBox.height / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  updatePosition(x: number = this.x, y: number = this.y) {
    if (!this.polygon) {
      return;
    }
    this.polygon.x = x;
    this.polygon.y = y;
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
  serialize(): EntityModel {
    return {
      entityId: this.entityId,
      x: this.x,
      y: this.y,
      create: this.create,
    };
  }

  postTick() {
    this.create = false;
  }
}

export type EntityModel = {create: boolean; entityId: number; x: number; y: number; realX?: number; realY?: number};
