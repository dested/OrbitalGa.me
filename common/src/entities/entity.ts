import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {EntityModels} from '../models/entityTypeModels';
import {nextId} from '../utils/uuid';

type BoundingBox = {
  height: number;
  offsetX?: number;
  offsetY?: number;
  polygon?: Polygon;
  width: number;
};

export abstract class Entity {
  alwaysPresent = false;
  boundingBoxes: BoundingBox[] = [];
  create: boolean = true;
  entityId: number;
  height: number = 0;
  markToDestroy: boolean = false;
  momentumX = 0;
  momentumY = 0;
  positionBuffer: {time: number; x: number; y: number}[] = [];
  width: number = 0;
  x: number = 0;
  y: number = 0;

  constructor(protected game: Game, entityId: number, public entityType: EntityModels['entityType']) {
    this.entityId = entityId;
  }

  abstract get realX(): number;
  abstract get realY(): number;

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

  abstract collide(otherEntity: Entity, collisionResult: Result): boolean;

  createPolygon(): void {
    const x = this.realX;
    const y = this.realY;
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

  destroy() {
    for (const boundingBox of this.boundingBoxes) {
      if (boundingBox.polygon) {
        this.game.collisionEngine.remove(boundingBox.polygon);
        boundingBox.polygon = undefined;
      }
    }
    this.markToDestroy = true;
  }

  abstract gameTick(duration: number): void;

  interpolateEntity(renderTimestamp: number) {
    const buffer = this.positionBuffer;

    while (buffer.length >= 2 && buffer[1].time <= renderTimestamp) {
      buffer.shift();
    }

    if (buffer.length >= 2 && buffer[0].time <= renderTimestamp) {
      const x0 = buffer[0].x;
      const x1 = buffer[1].x;
      const y0 = buffer[0].y;
      const y1 = buffer[1].y;
      const t0 = buffer[0].time;
      const t1 = buffer[1].time;

      this.x = x0 + ((x1 - x0) * (renderTimestamp - t0)) / (t1 - t0);
      this.y = y0 + ((y1 - y0) * (renderTimestamp - t0)) / (t1 - t0);
    }
  }

  postTick() {
    this.create = false;
  }

  reconcileFromServer(messageModel: EntityModel) {
    this.positionBuffer.push({time: +new Date(), x: messageModel.x, y: messageModel.y});
  }

  serialize(): EntityModel {
    return {
      entityId: this.entityId,
      x: this.x,
      y: this.y,
      create: this.create,
    };
  }

  start(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.updatePolygon();
  }

  updatePolygon() {
    if (this.boundingBoxes.length === 0) {
      return;
    }
    for (const boundingBox of this.boundingBoxes) {
      if (boundingBox.polygon) {
        boundingBox.polygon.x = this.realX;
        boundingBox.polygon.y = this.realY;
      }
    }
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: EntityModel) {
    buff.addFloat32(entity.x);
    buff.addFloat32(entity.y);
    buff.addUint32(entity.entityId);
    buff.addBoolean(entity.create);
  }

  static readBuffer(reader: ArrayBufferReader): EntityModel {
    return {
      x: reader.readFloat32(),
      y: reader.readFloat32(),
      entityId: reader.readUint32(),
      create: reader.readBoolean(),
    };
  }
}

export type EntityModel = {
  create: boolean;
  entityId: number;
  x: number;
  y: number;
};
