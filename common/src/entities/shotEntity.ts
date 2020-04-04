import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class ShotEntity extends Entity {
  boundingBox = {width: 9, height: 57};

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
    public shotOffsetY: number
  ) {
    super(game, entityId, 'shot');
    this.createPolygon(this.x + this.shotOffsetX, this.y + this.shotOffsetY);
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
    this.updatePosition(this.x + this.shotOffsetX, this.y + this.shotOffsetY);
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
      entityType: 'shot',
    };
  }

  static readBuffer(reader: ArrayBufferReader) {
    return {
      entityType: 'shot' as const,
      x: reader.readFloat32(),
      y: reader.readFloat32(),
      shotOffsetX: reader.readFloat32(),
      shotOffsetY: reader.readFloat32(),
      entityId: reader.readUint32(),
      ownerEntityId: reader.readUint32(),
      create: reader.readBoolean(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: ShotModel) {
    buff.addFloat32(entity.x);
    buff.addFloat32(entity.y);
    buff.addFloat32(entity.shotOffsetX);
    buff.addFloat32(entity.shotOffsetY);
    buff.addUint32(entity.entityId);
    buff.addUint32(entity.ownerEntityId);
    buff.addBoolean(entity.create);
  }
}

export type ShotModel = EntityModel & {
  entityType: 'shot';
  ownerEntityId: number;
  shotOffsetX: number;
  shotOffsetY: number;
};
