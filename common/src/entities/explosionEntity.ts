import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class ExplosionEntity extends Entity {
  static totalAliveDuration = 5;
  aliveDuration = ExplosionEntity.totalAliveDuration;

  constructor(game: Game, entityId: number, public intensity: number, public ownerEntityId?: number) {
    super(game, entityId, 'explosion');
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
  reconcileFromServer(messageModel: ExplosionModel) {
    super.reconcileFromServer(messageModel);
    this.ownerEntityId = messageModel.ownerEntityId;
    this.intensity = messageModel.intensity;
  }

  serialize(): ExplosionModel {
    return {
      ...super.serialize(),
      ownerEntityId: this.ownerEntityId,
      intensity: this.intensity,
      entityType: 'explosion',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: ExplosionModel) {
    Entity.addBuffer(buff, entity);
    buff.addUint8(entity.intensity);
    buff.addOptionalInt32(entity.ownerEntityId);
  }

  static readBuffer(reader: ArrayBufferReader): ExplosionModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'explosion',
      intensity: reader.readUint8(),
      ownerEntityId: reader.readOptionalInt32(),
    };
  }
}

export type ExplosionModel = EntityModel & {
  entityType: 'explosion';
  intensity: number;
  ownerEntityId?: number;
};
