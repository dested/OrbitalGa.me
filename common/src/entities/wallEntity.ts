import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class WallEntity extends Entity {
  constructor(game: Game, entityId: number, width: number, height: number) {
    super(game, entityId, 'wall');
    this.width = width;
    this.height = height;
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

  static addBuffer(buff: ArrayBufferBuilder, entity: WallModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint16(entity.width);
    buff.addUint16(entity.height);
  }

  static readBuffer(reader: ArrayBufferReader): WallModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'wall' as const,
      width: reader.readUint16(),
      height: reader.readUint16(),
    };
  }
}
export type WallModel = EntityModel & {
  entityType: 'wall';
  height: number;
  width: number;
};
