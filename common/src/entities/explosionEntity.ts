import {Result} from 'collisions';
import {Game, OrbitalGame} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {PhysicsEntity, PhysicsEntityModel, PhysicsEntityModelSchema} from '../baseEntities/physicsEntity';

export class ExplosionEntity extends PhysicsEntity{
  static totalAliveDuration = 5;
  aliveDuration = ExplosionEntity.totalAliveDuration;
  intensity: number;
  ownerEntityId?: number;
  type = 'explosion' as const;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ExplosionModel>) {
    super(game, messageModel);
    this.intensity = messageModel.intensity;
    this.ownerEntityId = messageModel.ownerEntityId;
    this.createPolygon();
  }

  get realX() {
    const owner = this.ownerEntityId && this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.position.x;
    }
    return this.position.x + owner.position.realX;
  }

  get realY() {
    const owner = this.ownerEntityId && this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return this.position.y;
    }
    return this.position.y + owner.position.realY;
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
      type: 'explosion',
    };
  }
}

export type ExplosionModel = PhysicsEntityModel & {
  intensity: number;
  ownerEntityId?: number;
  type: 'explosion';
};

export const ExplosionModelSchema: SDTypeElement<ExplosionModel> = {
  ...PhysicsEntityModelSchema,
  intensity: 'uint8',
  ownerEntityId: 'int32Optional',
};
