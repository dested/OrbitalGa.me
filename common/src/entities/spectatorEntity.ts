import {Result} from 'collisions';
import {Game} from '../game/game';
import {unreachable} from '../utils/unreachable';
import {Entity, EntityModel} from './entity';
import {GameConstants} from '../game/gameConstants';
import {ShotEntity} from './shotEntity';
import {nextId} from '../utils/uuid';
import {ArrayBufferBuilder, ArrayBufferReader} from '../parsers/arrayBufferBuilder';
import {ClientGame} from '../../../client/src/game/clientGame';

export class SpectatorEntity extends Entity {
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
