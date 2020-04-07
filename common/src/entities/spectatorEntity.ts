import {Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';

export class SpectatorEntity extends Entity {
  get realX() {
    return this.x;
  }
  get realY() {
    return this.y;
  }

  constructor(game: Game, entityId: number) {
    super(game, entityId, 'spectator');
    this.createPolygon();
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

  static readBuffer(reader: ArrayBufferReader): SpectatorModel {
    return {
      ...Entity.readBuffer(reader),
      entityType: 'spectator',
    };
  }

  static addBuffer(buff: ArrayBufferBuilder, entity: SpectatorModel) {
    Entity.addBuffer(buff, entity);
  }
}

export type SpectatorModel = EntityModel & {
  entityType: 'spectator';
};
