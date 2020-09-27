import {Result} from 'collisions';
import {OrbitalGame} from '../game/game';
import {Entity} from '../baseEntities/entity';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';
import {ImpliedEntityType} from '../models/serverToClientMessages';

export class WallEntity extends PhysicsEntity {
  type = 'wall' as const;
  mass = Number.MAX_SAFE_INTEGER;
  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<WallModel>>) {
    super(game, messageModel);
    this.width = messageModel.width;
    this.height = messageModel.height;
    this.boundingBoxes.push({
      width: this.width,
      height: this.height,
    });
    this.createPolygon();
  }

  collide(otherEntity: PhysicsEntity, collisionResult: Result) {
    otherEntity.position.add({
      x: -collisionResult.overlap * collisionResult.overlap_x,
      y: -collisionResult.overlap * collisionResult.overlap_y,
    });
    otherEntity.velocity.set(0, 0);
  }

  gameTick(): void {}

  serialize(): WallModel {
    return {
      ...super.serialize(),
      width: this.width,
      height: this.height,
      type: 'wall',
    };
  }
}
export type WallModel = PhysicsEntityModel & {
  height: number;
  type: 'wall';
  width: number;
};

export const WallModelSchema: SDTypeElement<WallModel> = {
  ...PhysicsEntityModelSchema,
  width: 'uint16',
  height: 'uint16',
};
