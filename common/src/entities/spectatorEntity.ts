import {Result} from 'collisions';
import {Game, OrbitalGame} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from '../baseEntities/entity';
import {ImpliedEntityType} from '../models/serverToClientMessages';
import {SDTypeElement} from '../schemaDefiner/schemaDefinerTypes';
import {PhysicsEntity, PhysicsEntityModel, PhysicsEntityModelSchema} from '../baseEntities/physicsEntity';

export class SpectatorEntity extends PhysicsEntity{
  type = 'spectator' as const;
  constructor(public game: OrbitalGame, messageModel: ImpliedEntityType<SpectatorModel>) {
    super(game, messageModel);
    this.createPolygon();
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
