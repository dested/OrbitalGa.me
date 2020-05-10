import {Result} from 'collisions';
import {Game, OrbitalGame} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {PhysicsEntity, PhysicsEntityModel, PhysicsEntityModelSchema} from '../baseEntities/physicsEntity';

export class WallEntity extends PhysicsEntity {
  type = 'wall' as const;
  constructor(public game: OrbitalGame, messageModel: WallModel) {
    super(game, messageModel);
    this.width = messageModel.width;
    this.height = messageModel.height;
    this.boundingBoxes.push({
      width: this.width,
      height: this.height,
    });
    this.createPolygon();
  }

  get realX() {
    return this.position.x;
  }

  get realY() {
    return this.position.y;
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
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
