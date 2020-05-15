import {Game} from '../game/game';
import {Polygon, Result} from 'collisions';
import {SDSimpleObject} from '../schemaDefiner/schemaDefinerTypes';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {TwoVector, TwoVectorModel, TwoVectorSchema} from '../utils/twoVector';
import {MathUtils} from '../utils/mathUtils';
import {Utils} from '../utils/utils';

type PartialOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type ImpliedDefaultPhysics<T extends PhysicsEntityModel> = PartialOptional<
  T,
  'friction' | 'velocity' | 'position' | 'angle'
>;
type BoundingBox = {
  height: number;
  offsetX?: number;
  offsetY?: number;
  polygon?: Polygon;
  width: number;
};
export abstract class PhysicsEntity extends Entity {
  angle!: number;
  bendingAngleDelta?: number;
  bendingIncrements = 0;
  bendingPositionDelta?: TwoVector;
  bendingVelocityDelta?: TwoVector;
  boundingBoxes: BoundingBox[] = [];
  friction!: TwoVector;
  height: number = 0;
  maxSpeed?: number;
  position!: TwoVector;
  savedCopy?: PhysicsEntityModel;
  velocity!: TwoVector;
  width: number = 0;

  constructor(game: Game, messageModel: ImpliedDefaultPhysics<PhysicsEntityModel>) {
    super(game, messageModel);
    messageModel.angle = messageModel.angle ?? Utils.byteDegToDeg(90);
    messageModel.friction = messageModel.friction ?? new TwoVector(1, 1);
    messageModel.position = messageModel.position ?? new TwoVector(0, 0);
    messageModel.velocity = messageModel.velocity ?? new TwoVector(0, 0);
    this.reconcileFromServer(messageModel as PhysicsEntityModel);
  }

  get bending(): {
    [key in
      | 'position'
      | 'velocity'
      | 'angle'
      | 'positionLocal'
      | 'velocityLocal'
      | 'angleLocal'
      | 'angularVelocity']?: {
      increments?: number;
      max?: number;
      min?: number;
      percent: number;
    };
  } {
    return {};
  }

  applyIncrementalBending(stepDesc: {dt: number}) {
    if (
      this.bendingIncrements === 0 ||
      !this.bendingPositionDelta ||
      !this.bendingVelocityDelta ||
      this.bendingAngleDelta === undefined
    )
      return;

    const timeFactor = stepDesc.dt / (1000 / 60);
    const posDelta = this.bendingPositionDelta.clone().multiplyScalar(timeFactor);
    const velDelta = this.bendingVelocityDelta.clone().multiplyScalar(timeFactor);
    this.position.add(posDelta);
    this.velocity.add(velDelta);
    this.angle += this.bendingAngleDelta * timeFactor;

    this.bendingIncrements--;
  }

  bendToCurrent(original: PhysicsEntityModel, percent: number, isLocal: boolean, increments: number) {
    const bending = {increments, percent};
    // if the object has defined a bending multiples for this object, use them
    let positionBending = {...bending, ...this.bending.position};
    let velocityBending = {...bending, ...this.bending.velocity};
    let angleBending = {...bending, ...this.bending.angle};

    if (isLocal) {
      positionBending = {...positionBending, ...this.bending.positionLocal};
      velocityBending = {...velocityBending, ...this.bending.velocityLocal};
      angleBending = {...positionBending, ...this.bending.angleLocal};
    }

    // get the incremental delta position & velocity
    this.bendingPositionDelta = TwoVector.getBendingDelta(original.position, this.position, positionBending);
    this.bendingVelocityDelta = TwoVector.getBendingDelta(original.velocity, this.velocity, velocityBending);
    this.bendingAngleDelta =
      MathUtils.interpolateDeltaWithWrapping(original.angle % 255, this.angle % 255, angleBending.percent, 0, 255) /
      increments;

    // revert to original
    this.position.copy(original.position);
    this.velocity.copy(original.velocity);
    this.angle = original.angle % 255;

    // keep parameters
    this.bendingIncrements = increments;
  }

  bendToCurrentState(bending: number, isLocal: boolean, bendingIncrements: number) {
    if (this.savedCopy) {
      this.bendToCurrent(this.savedCopy, bending, isLocal, bendingIncrements);
    }
    this.savedCopy = undefined;
  }

  bounce(momentumX: number, momentumY: number) {
    this.velocity.add({
      x: momentumX * 50,
      y: momentumY * 50,
    });
  }

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

  createPolygon(x = this.position.x, y = this.position.y): void {
    // todo physics this needs to call update polygon and anything that really uses realx needs to update accordingly
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
    super.destroy();
    for (const boundingBox of this.boundingBoxes) {
      if (boundingBox.polygon) {
        this.game.collisionEngine.remove(boundingBox.polygon);
        boundingBox.polygon = undefined;
      }
    }
  }

  inView(viewX: number, viewY: number, viewWidth: number, viewHeight: number, playerId: number) {
    return (
      this.position.x > viewX &&
      this.position.x < viewX + viewWidth &&
      this.position.y > viewY &&
      this.position.y < viewY + viewHeight
    );
  }

  reconcileFromServer(messageModel: PhysicsEntityModel) {
    super.reconcileFromServer(messageModel);
    this.angle = messageModel.angle;
    this.position = TwoVector.fromModel(messageModel.position);
    this.velocity = TwoVector.fromModel(messageModel.velocity);
    this.friction = TwoVector.fromModel(messageModel.friction);
  }

  saveState(entityModel?: PhysicsEntityModel) {
    this.savedCopy = entityModel ?? this.serialize();
  }

  serialize(): PhysicsEntityModel {
    return {
      ...super.serialize(),
      position: this.position.serialize(),
      velocity: this.velocity.serialize(),
      friction: this.friction.serialize(),
      angle: this.angle,
    };
  }

  updatePolygon(x = this.position.x, y = this.position.y) {
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
}

export type PhysicsEntityModel = EntityModel & {
  angle: number;
  friction: TwoVectorModel;
  position: TwoVectorModel;
  velocity: TwoVectorModel;
};

export const PhysicsEntityModelSchema: SDSimpleObject<PhysicsEntityModel> = {
  ...EntityModelSchema,
  position: TwoVectorSchema,
  friction: TwoVectorSchema,
  velocity: TwoVectorSchema,
  angle: 'uint8',
};
