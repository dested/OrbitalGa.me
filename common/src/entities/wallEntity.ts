import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';

export class WallEntity extends Entity {
  type = 'wall' as const;
  constructor(game: Game, messageModel: WallModel) {
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
    return this.x;
  }

  get realY() {
    return this.y;
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
export type WallModel = EntityModel & {
  height: number;
  type: 'wall';
  width: number;
};

export const WallModelSchema: SDTypeElement<WallModel> = {
  ...EntityModelSchema,
  width: 'uint16',
  height: 'uint16',
};
