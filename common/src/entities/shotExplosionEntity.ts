import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class ShotExplosionEntity extends Entity {
  get realX() {
    const owner = this.ownerEntityId && this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.x;
    }
    return this.x + owner.realX;
  }
  get realY() {
    const owner = this.ownerEntityId && this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.y;
    }
    return this.y + owner.realY;
  }

  constructor(game: Game, entityId: number, public ownerEntityId?: number) {
    super(game, entityId, 'shotExplosion');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }

  static totalAliveDuration = 5;
  aliveDuration = ShotExplosionEntity.totalAliveDuration;
  gameTick(duration: number) {
    this.aliveDuration -= 1;
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }
  serialize(): ShotExplosionModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      entityType: 'shotExplosion',
    };
  }
  reconcileFromServer(messageEntity: ShotExplosionModel) {
    super.reconcileFromServer(messageEntity);
    this.ownerEntityId = messageEntity.ownerEntityId;
  }

  static readBuffer(reader: ArrayBufferReader): ShotExplosionModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'shotExplosion',
      ownerEntityId: reader.readOptionalInt32(),
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: ShotExplosionModel) {
    Entity.addBuffer(buff, entity);
    buff.addOptionalInt32(entity.ownerEntityId);
  }
}

export type ShotExplosionModel = EntityModel & {
  entityType: 'shotExplosion';
  ownerEntityId?: number;
};
