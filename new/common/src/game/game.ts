import {Collisions, Polygon, Result} from 'collisions';
import {GameEntity} from './entities/gameEntity';
import {PlayerEntity} from './entities/playerEntity';

export class Game {
  collisionEngine: Collisions;
  entities: GameEntity[] = [];
  readonly collisionResult: Result;

  get playerEntities(): PlayerEntity[] {
    return this.entities.filter(a => a instanceof PlayerEntity).map(a => a as PlayerEntity);
  }

  get nonPlayerEntities(): GameEntity[] {
    return this.entities.filter(a => !(a instanceof PlayerEntity));
  }

  constructor() {
    this.collisionEngine = new Collisions();
    this.collisionResult = this.collisionEngine.createResult();
  }

  protected checkCollisions(solidOnly: boolean) {
    this.collisionEngine.update();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (!entity || entity.clientDeath || entity.willDestroy) {
        continue;
      }
      entity.checkCollisions(solidOnly);
    }
  }

  addEntity(entity: GameEntity) {
    this.entities.push(entity);
  }
}
