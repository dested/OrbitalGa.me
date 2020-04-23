import {Collisions, Result} from 'collisions';
import {Entity} from '../entities/entity';
import {ArrayHash} from '../utils/arrayHash';
import {nextId} from '../utils/uuid';
import {ExplosionEntity} from '../entities/explosionEntity';
import {EntityClusterer} from '../../../server/src/game/entityClusterer';
import {GameLeaderboard} from './gameLeaderboard';
import {PlayerEntity} from '../entities/playerEntity';

export abstract class Game {
  collisionEngine: Collisions;
  readonly collisionResult: Result;
  entities = new ArrayHash<Entity>('entityId');
  entityClusterer: EntityClusterer;
  gameLeaderboard = new GameLeaderboard();
  totalPlayers: number = 0;

  constructor(public isClient: boolean) {
    this.collisionEngine = new Collisions();
    this.collisionResult = this.collisionEngine.createResult();
    this.entityClusterer = new EntityClusterer(this.entities, 3);
  }

  explode(entity: Entity, explosionSize: 'small' | 'medium' | 'big') {
    entity.destroy();
    let size = 0;
    switch (explosionSize) {
      case 'small':
        size = 3;
        break;
      case 'medium':
        size = 5;
        break;
      case 'big':
        size = 8;
        break;
    }
    for (let i = 0; i < size; i++) {
      const deathExplosion = new ExplosionEntity(this, {
        entityId: nextId(),
        x: entity.x - entity.boundingBoxes[0].width / 2 + Math.random() * entity.boundingBoxes[0].width,
        y: entity.y - entity.boundingBoxes[0].height / 2 + Math.random() * entity.boundingBoxes[0].height,
        intensity: 2,
      });
      this.entities.push(deathExplosion);
    }
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

  abstract killPlayer(player: PlayerEntity): void;

  protected checkCollisions() {
    this.collisionEngine.update();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities.getIndex(i);
      entity.checkCollisions();
    }
  }
}
