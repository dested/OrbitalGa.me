import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {WorldStateEntity} from '../models/entityTypeModels';

export abstract class Entity {
  width: number = 0;
  height: number = 0;

  boundingBoxes: {
    polygon?: Polygon;
    offsetX?: number;
    offsetY?: number;
    width: number;
    height: number;
  }[] = [];

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
  constructor(protected game: Game, entityId: number, public entityType: WorldStateEntity['entityType']) {
    this.entityId = entityId;
  }

  start(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.updatePosition();
  }

  createPolygon(x: number = this.x, y: number = this.y): void {
    if (this.width !== 0 && this.height !== 0) {
      for (const boundingBox of this.boundingBoxes) {
        const polygon = new Polygon(
          x - this.width / 2 + (boundingBox.offsetX ?? 0),
          y - this.height / 2 + (boundingBox.offsetY ?? 0),
          [
            [0, 0],
            [boundingBox.width, 0],
            [boundingBox.width, boundingBox.height],
            [0, boundingBox.height],
          ]
        );
        polygon.entity = this;
        boundingBox.polygon = polygon;
        this.game.collisionEngine.insert(polygon);
      }
    } else {
      for (const boundingBox of this.boundingBoxes) {
        const polygon = new Polygon(x + (boundingBox.offsetX ?? 0), y + (boundingBox.offsetY ?? 0), [
          [-boundingBox.width / 2, -boundingBox.height / 2],
          [boundingBox.width / 2, -boundingBox.height / 2],
          [boundingBox.width / 2, boundingBox.height / 2],
          [-boundingBox.width / 2, boundingBox.height / 2],
        ]);
        polygon.entity = this;
        boundingBox.polygon = polygon;
        this.game.collisionEngine.insert(polygon);
      }
    }
  }

  updatePosition(x: number = this.x, y: number = this.y) {
    if (this.boundingBoxes.length === 0) {
      return;
    }
    for (const boundingBox of this.boundingBoxes) {
      if (boundingBox.polygon) {
        boundingBox.polygon.x = x;
        boundingBox.polygon.y = y;
      }
    }
  }

  markToDestroy: boolean = false;
  destroy() {
    for (const boundingBox of this.boundingBoxes) {
      if (boundingBox.polygon) {
        this.game.collisionEngine.remove(boundingBox.polygon);
        boundingBox.polygon = undefined;
      }
    }
    this.markToDestroy = true;
  }

  abstract collide(otherEntity: Entity, collisionResult: Result): boolean;

  checkCollisions() {
    if (this.boundingBoxes.length === 0) {
      return;
    }

    for (const boundingBox of this.boundingBoxes) {
      const polygon = boundingBox.polygon;
      if (!polygon) {
        continue;
      }
      const potentials = polygon.potentials();
      for (const body of potentials) {
        if (polygon && polygon.collides(body, this.game.collisionResult)) {
          const collided = this.collide(body.entity, this.game.collisionResult);
          if (collided) {
            return true;
          }
        }
      }
    }

    return false;
  }

  abstract gameTick(duration: number): void;
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

  reconcileFromServer(messageEntity: EntityModel) {
    this.positionBuffer.push({time: +new Date(), x: messageEntity.x, y: messageEntity.y});
  }

  static readBuffer(reader: ArrayBufferReader): EntityModel {
    return {
      x: reader.readFloat32(),
      y: reader.readFloat32(),
      entityId: reader.readUint32(),
      create: reader.readBoolean(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: EntityModel) {
    buff.addFloat32(entity.x);
    buff.addFloat32(entity.y);
    buff.addUint32(entity.entityId);
    buff.addBoolean(entity.create);
  }
}

export type EntityModel = {
  create: boolean;
  entityId: number;
  x: number;
  y: number;
  realX?: number;
  realY?: number;
};
