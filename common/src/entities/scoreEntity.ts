import {Game, OrbitalGame} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {Result} from 'collisions';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {PhysicsEntity, PhysicsEntityModel, PhysicsEntityModelSchema} from '../baseEntities/physicsEntity';

//todo make not physics entity
export class ScoreEntity extends PhysicsEntity {
  score: number;
  type = 'score' as const;
  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ScoreModel>) {
    super(game, messageModel);
    this.score = messageModel.score;
    this.onlyVisibleToPlayerEntityId = messageModel.onlyVisibleToPlayerEntityId;
  }

  get realX() {
    return this.x;
  }

  get realY() {
    return this.y;
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }

  aliveTick = 0;
  gameTick(): void {
    this.aliveTick++;
    if (this.aliveTick > 3) {
      this.destroy();
    }
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
