import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class ShotExplosionEntity extends Entity {
  static totalAliveDuration = 5;
  aliveDuration = ShotExplosionEntity.totalAliveDuration;

  constructor(game: Game, entityId: number, public intensity: number, public ownerEntityId?: number) {
    super(game, entityId, 'shotExplosion');
    this.createPolygon();
  }
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

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }
  gameTick(duration: number) {
    this.aliveDuration -= 1;
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }
  reconcileFromServer(messageEntity: ShotExplosionModel) {
    super.reconcileFromServer(messageEntity);
    this.ownerEntityId = messageEntity.ownerEntityId;
    this.intensity = messageEntity.intensity;
  }

  serialize(): ShotExplosionModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      intensity: this.intensity,
      entityType: 'shotExplosion',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: ShotExplosionModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.intensity);
    buff.addOptionalInt32(entity.ownerEntityId);
  }

  static readBuffer(reader: ArrayBufferReader): ShotExplosionModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'shotExplosion',
      intensity: reader.readUint8(),
      ownerEntityId: reader.readOptionalInt32(),
    };
  }
}

export type ShotExplosionModel = EntityModel & {
  entityType: 'shotExplosion';
  intensity: number;
  ownerEntityId?: number;
};
