import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {ImpliedEntityType} from '../models/entityTypeModels';

export class SpectatorEntity extends Entity {
  entityType = 'spectator' as const;
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
      entityType: 'spectator',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: SpectatorModel) {
    Entity.addBuffer(buff, entity);
  }

  static readBuffer(reader: ArrayBufferReader): SpectatorModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'spectator',
    };
  }
}

export type SpectatorModel = EntityModel & {
  entityType: 'spectator';
};
