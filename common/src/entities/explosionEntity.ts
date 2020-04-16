import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {ImpliedEntityType} from '../models/entityTypeModels';
import {ABSizeByType} from '../parsers/arrayBufferSchemaTypes';
import {EntityModelSchemaType} from '../models/serverToClientMessages';

export class ExplosionEntity extends Entity {
  static totalAliveDuration = 5;
  aliveDuration = ExplosionEntity.totalAliveDuration;
  entityType = 'explosion' as const;
  intensity: number;
  ownerEntityId?: number;

  constructor(game: Game, messageModel: ImpliedEntityType<ExplosionModel>) {
    super(game, messageModel);
    this.intensity = messageModel.intensity;
    this.ownerEntityId = messageModel.ownerEntityId;
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
      this.destroy();
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
}

export type ExplosionModel = EntityModel & {
  entityType: 'explosion';
  intensity: number;
  ownerEntityId?: number;
};

export const ExplosionModelSchema: EntityModelSchemaType<'explosion'> = {
  ...EntityModelSchema,
  intensity: 'uint8',
  ownerEntityId: 'int32Optional',
};
