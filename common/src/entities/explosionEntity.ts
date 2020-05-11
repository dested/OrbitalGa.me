import {Result} from 'collisions';
import {Game, OrbitalGame} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';

export class ExplosionEntity extends PhysicsEntity {
  static totalAliveDuration = 5;
  aliveDuration = ExplosionEntity.totalAliveDuration;
  intensity: number;
  ownerEntityId?: number;
  type = 'explosion' as const;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<ExplosionModel>>) {
    super(game, messageModel);
    this.intensity = messageModel.intensity;
    this.ownerEntityId = messageModel.ownerEntityId;
    this.createPolygon();
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

  isVisibleAtCoordinate(
    viewX: number,
    viewY: number,
    viewWidth: number,
    viewHeight: number,
    playerId: number
  ): boolean {
    const owner = this.ownerEntityId && this.game.entities.lookup<PhysicsEntity>(this.ownerEntityId);

    let x = this.position.x;
    let y = this.position.y;

    if (owner) {
      x += owner.position.x;
      y += owner.position.y;
    }

    return x > viewX && x < viewX + viewWidth && y > viewY && y < viewY + viewHeight;
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
