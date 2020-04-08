import {Collisions, Result} from 'collisions';
import {Entity} from '../entities/entity';
import {ArrayHash} from '../utils/arrayHash';

export abstract class Game {
  collisionEngine: Collisions;
  readonly collisionResult: Result;
  entities = new ArrayHash<Entity>('entityId');

  constructor(public isClient: boolean) {
    this.collisionEngine = new Collisions();
    this.collisionResult = this.collisionEngine.createResult();
  }

  destroyEntity(entity: Entity) {
    entity.destroy();
  }

  getPlayerRange(padding: number, filter: (e: Entity) => boolean) {
    const range = {x0: Number.POSITIVE_INFINITY, x1: Number.NEGATIVE_INFINITY};
    const playerEntities = this.entities.filter(filter);

    if (playerEntities.length === 0) {
      return {x0: -padding, x1: padding};
    }
    for (const entity of playerEntities) {
      range.x0 = Math.min(range.x0, entity.x);
      range.x1 = Math.max(range.x1, entity.x);
    }
    return {x0: range.x0 - padding, x1: range.x1 + padding};
  }

  protected checkCollisions() {
    this.collisionEngine.update();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities.getIndex(i);
      entity.checkCollisions();
    }
  }
}
