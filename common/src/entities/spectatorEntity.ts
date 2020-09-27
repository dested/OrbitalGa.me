import {Result} from 'collisions';
import {OrbitalGame} from '../game/game';
import {Entity} from '../baseEntities/entity';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {
  ImpliedDefaultPhysics,
  PhysicsEntity,
  PhysicsEntityModel,
  PhysicsEntityModelSchema,
} from '../baseEntities/physicsEntity';

export class SpectatorEntity extends PhysicsEntity {
  type = 'spectator' as const;
  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<ImpliedDefaultPhysics<SpectatorModel>>) {
    super(game, messageModel);
    this.createPolygon();
  }

  collide(otherEntity: PhysicsEntity, collisionResult: Result) {}

  gameTick(duration: number): void {}

  serialize(): SpectatorModel {
    return {
      ...super.serialize(),
      type: 'spectator',
    };
  }
}

export type SpectatorModel = PhysicsEntityModel & {
  type: 'spectator';
};

export const SpectatorModelSchema: SDTypeElement<SpectatorModel> = {
  ...PhysicsEntityModelSchema,
};
