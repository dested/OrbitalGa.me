import {Game, OrbitalGame} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {Result} from 'collisions';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';

// todo make not physics entity
export class ScoreEntity extends PhysicsEntity {
  aliveTick = 0;
  onlyVisibleToPlayerEntityId: number;
  score: number;
  type = 'score' as const;

  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<ScoreModel>>) {
    super(game, messageModel);
    this.score = messageModel.score;
    this.onlyVisibleToPlayerEntityId = messageModel.onlyVisibleToPlayerEntityId;
    this.velocity.set(0, -80);
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }
  gameTick(): void {
    this.aliveTick++;
    if (this.aliveTick > 60 * 1) {
      this.destroy();
    }
  }
  inView(viewX: number, viewY: number, viewWidth: number, viewHeight: number, playerId: number): boolean {
    const result = super.inView(viewX, viewY, viewWidth, viewHeight, playerId);
    return result && this.onlyVisibleToPlayerEntityId === playerId;
  }

  serialize(): ScoreModel {
    return {
      ...super.serialize(),
      score: this.score,
      onlyVisibleToPlayerEntityId: this.onlyVisibleToPlayerEntityId!,
      type: 'score',
    };
  }
}
export type ScoreModel = PhysicsEntityModel & {
  onlyVisibleToPlayerEntityId: number;
  score: number;
  type: 'score';
};

export const ScoreModelSchema: SDTypeElement<ScoreModel> = {
  ...PhysicsEntityModelSchema,
  score: 'uint16',
  onlyVisibleToPlayerEntityId: 'uint32',
};
