import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class ShotEntity extends Entity {
  boundingBoxes = [{width: 9, height: 57}];

  get realX() {
    return this.x + this.shotOffsetX;
  }
  get realY() {
    return this.y + this.shotOffsetY;
  }

  constructor(
    game: Game,
    entityId: number,
    public ownerEntityId: number,
    public shotOffsetX: number,
    public shotOffsetY: number,
    public startY: number
  ) {
    super(game, entityId, 'shot');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.game.destroyEntity(this);
      return true;
    }
    return false;
  }

  shotSpeedPerSecond = 1000;
  aliveDuration = 3000;

  gameTick(duration: number) {
    this.y -= this.shotSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }


  serialize(): ShotModel {
    return {
      ...super.serialize(),
      shotOffsetX: this.shotOffsetX,
      shotOffsetY: this.shotOffsetY,
      ownerEntityId: this.ownerEntityId,
      startY: this.startY,
      entityType: 'shot',
    };
  }

  static readBuffer(reader: ArrayBufferReader): ShotModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'shot',
      shotOffsetX: reader.readFloat32(),
      shotOffsetY: reader.readFloat32(),
      startY: reader.readFloat32(),
      ownerEntityId: reader.readUint32(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: ShotModel) {
    Entity.addBuffer(buff, entity);
    buff.addFloat32(entity.shotOffsetX);
    buff.addFloat32(entity.shotOffsetY);
    buff.addFloat32(entity.startY);
    buff.addUint32(entity.ownerEntityId);
  }
}

export type ShotModel = EntityModel & {
  entityType: 'shot';
  ownerEntityId: number;
  shotOffsetX: number;
  shotOffsetY: number;
  startY: number;
};
