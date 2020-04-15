import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {EntityModels} from '../models/entityTypeModels';
import {GameConstants} from '../game/gameConstants';
import {Size} from '../parsers/arrayBufferSchema';

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
  abstract entityType: EntityModels['entityType'];
  height: number = 0;
  markToDestroy: boolean = false;
  momentumX = 0;
  momentumY = 0;
  positionBuffer: {time: number; x: number; y: number}[] = [];
  width: number = 0;
  x: number = 0;
  y: number = 0;

  constructor(protected game: Game, messageModel: EntityModel) {
    this.entityId = messageModel.entityId;
    this.x = messageModel.x;
    this.y = messageModel.y;
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
        if (polygon.collides(body, this.game.collisionResult)) {
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
    if (this.game.isClient) {
      if (messageModel.create) {
        this.x = messageModel.x;
        this.y = messageModel.y;
        this.positionBuffer.push({
          time: +new Date() - GameConstants.serverTickRate,
          x: messageModel.x,
          y: messageModel.y,
        });
      }
      this.positionBuffer.push({time: +new Date(), x: messageModel.x, y: messageModel.y});
    }
  }

  serialize(): EntityModel {
    return {
      entityId: this.entityId,
      x: this.x,
      y: this.y,
      create: this.create,
    };
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
}

export type EntityModel = {
  create?: boolean;
  entityId: number;
  x: number;
  y: number;
};

export const EntityModelSchema: Size<EntityModel> = {
  x: 'float32',
  y: 'float32',
  entityId: 'uint32',
  create: 'boolean',
};
