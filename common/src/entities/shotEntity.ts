import {Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class ShotEntity extends Entity {
  boundingBoxes = [{width: 9, height: 57}];

  get realX() {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.x;
    }
    return this.x + owner.realX;
  }
  get realY() {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.y;
    }
    return this.y + owner.realY;
  }

  constructor(game: Game, entityId: number, public ownerEntityId: number) {
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
      ownerEntityId: this.ownerEntityId,
      entityType: 'shot',
    };
  }

  static readBuffer(reader: ArrayBufferReader): ShotModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'shot',
      ownerEntityId: reader.readUint32(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: ShotModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint32(entity.ownerEntityId);
  }
}

export type ShotModel = EntityModel & {
  entityType: 'shot';
  ownerEntityId: number;
};
