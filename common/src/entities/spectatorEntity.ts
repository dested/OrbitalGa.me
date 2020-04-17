import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel, EntityModelSchema} from './entity';
import {EntityModels, ImpliedEntityType} from '../models/entityTypeModels';
import {EntityModelSchemaType} from '../models/serverToClientMessages';
import {SDTypeElement, SDTypeLookup} from '../schemaDefiner/schemaDefinerTypes';
import {PlayerWeaponModel} from './playerWeaponEntity';

export class SpectatorEntity extends Entity {
  type = 'spectator' as const;
  constructor(game: Game, messageModel: ImpliedEntityType<SpectatorModel>) {
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

export type SpectatorModel = EntityModel & {
  type: 'spectator';
};

export const SpectatorModelSchema: SDTypeElement<SpectatorModel> = {
  ...EntityModelSchema,
};
