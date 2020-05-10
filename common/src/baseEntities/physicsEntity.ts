import {Game} from '../game/game';
import {Polygon, Result} from 'collisions';
import {SDSimpleObject} from '../schemaDefiner/schemaDefinerTypes';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {TwoVector, TwoVectorModel, TwoVectorSchema} from '../utils/twoVector';
import {MathUtils} from '../utils/mathUtils';

export abstract class PhysicsEntity extends Entity {
  angle: number = 90;
  bendingIncrements = 0;
  friction: TwoVector;
  height: number = 0;

  position!: TwoVector;

  savedCopy?: PhysicsEntityModel;
  velocity!: TwoVector;
  width: number = 0;
  private bendingAngleDelta?: number;

  private bendingPositionDelta?: TwoVector;
  private bendingVelocityDelta?: TwoVector;

  constructor(protected game: Game, messageModel: PhysicsEntityModel) {
    super(game, messageModel);
    this.friction = new TwoVector(1, 1);
    this.reconcileFromServer(messageModel);
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

  abstract get realX(): number;
  abstract get realY(): number;

  accelerate(acceleration: number, angle: number) {
    const rad = angle * (Math.PI / 180);
    const dv = new TwoVector(Math.cos(rad), Math.sin(rad));
    dv.multiplyScalar(acceleration);
    this.velocity.add(dv);
    return this;
  }

  applyIncrementalBending(stepDesc: {dt?: number}) {
    if (
      this.bendingIncrements === 0 ||
      !this.bendingPositionDelta ||
      !this.bendingVelocityDelta ||
      this.bendingAngleDelta === undefined
    )
      return;

    let timeFactor = 1;
    if (stepDesc && stepDesc.dt) timeFactor = stepDesc.dt / (1000 / 60);

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
    let positionBending = Object.assign({}, bending, this.bending.position);
    let velocityBending = Object.assign({}, bending, this.bending.velocity);
    let angleBending = Object.assign({}, bending, this.bending.angle);

    if (isLocal) {
      positionBending = {...positionBending, ...this.bending.positionLocal};
      velocityBending = {...positionBending, ...this.bending.velocityLocal};
      angleBending = {...positionBending, ...this.bending.angleLocal};
    }

    // get the incremental delta position & velocity
    this.bendingPositionDelta = TwoVector.getBendingDelta(original.position, this.position, positionBending);
    this.bendingVelocityDelta = TwoVector.getBendingDelta(original.velocity, this.velocity, velocityBending);
    this.bendingAngleDelta =
      MathUtils.interpolateDeltaWithWrapping(original.angle, this.angle, angleBending.percent, 0, 360) / increments;

    // revert to original
    this.position.copy(original.position);
    this.velocity.copy(original.velocity);
    this.angle = original.angle;

    // keep parameters
    this.bendingIncrements = increments;
  }

  bendToCurrentState(bending: number, isLocal: boolean, bendingIncrements: number) {
    if (this.savedCopy) {
      this.bendToCurrent(this.savedCopy, bending, isLocal, bendingIncrements);
    }
    this.savedCopy = undefined;
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
    super.destroy();
    for (const boundingBox of this.boundingBoxes) {
      if (boundingBox.polygon) {
        this.game.collisionEngine.remove(boundingBox.polygon);
        boundingBox.polygon = undefined;
      }
    }
    this.markToDestroy = true;
  }

  isVisibleAtCoordinate(viewX: number, viewY: number, viewWidth: number, viewHeight: number) {
    return true;
  }

  reconcileFromServer(messageModel: PhysicsEntityModel) {
    super.reconcileFromServer(messageModel);
    this.position = TwoVector.fromModel(messageModel.position);
    this.velocity = TwoVector.fromModel(messageModel.velocity);
  }
  saveState(entityModel?: PhysicsEntityModel) {
    this.savedCopy = entityModel ?? this.serialize();
  }

  serialize(): PhysicsEntityModel {
    return {
      ...super.serialize(),
      position: this.position.serialize(),
      velocity: this.velocity.serialize(),
      angle: this.angle,
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

export type PhysicsEntityModel = EntityModel & {
  angle: number;
  position: TwoVectorModel;
  velocity: TwoVectorModel;
};

export const PhysicsEntityModelSchema: SDSimpleObject<PhysicsEntityModel> = {
  ...EntityModelSchema,
  position: TwoVectorSchema,
  velocity: TwoVectorSchema,
  angle: 'uint8',
};
