import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {EntitySizeByType, Size} from '../parsers/arrayBufferSchema';

export class WallEntity extends Entity {
  entityType = 'wall' as const;
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
      entityType: 'wall',
    };
  }
}
export type WallModel = EntityModel & {
  entityType: 'wall';
  height: number;
  width: number;
};

export const WallModelSchema: EntitySizeByType<WallModel, 'wall'> = {
  entityType: 6,
  ...EntityModelSchema,
  width: 'uint16',
  height: 'uint16',
};
