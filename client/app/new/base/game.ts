import {Collisions, Result} from 'collisions';
import {GameEntity} from './entities/gameEntity';
import {PlayerEntity} from './entities/playerEntity';

export class Game {
  static tickRate = 50;

  collisionEngine: Collisions;
  entities: GameEntity[] = [];
  private readonly collisionResult: Result;

  get playerEntities(): PlayerEntity[] {
    return this.entities.filter(a => a instanceof PlayerEntity).map(a => a as PlayerEntity);
  }

  get nonPlayerEntities(): GameEntity[] {
    return this.entities.filter(a => !(a instanceof PlayerEntity));
  }

  // public world:GameWord;

  constructor() {
    this.collisionEngine = new Collisions();
    this.collisionResult = this.collisionEngine.createResult();
  }

  protected checkCollisions() {
    this.collisionEngine.update();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (!entity) {
        continue;
      }
      const potentials = entity.polygon.potentials();
      for (const body of potentials) {
        if (entity.polygon && entity.polygon.collides(body, this.collisionResult)) {
          const e1 = entity.collide(body.entity, this.collisionResult);
          const e2 = body.entity.collide(entity, this.collisionResult);
          if (e1 || e2) {
            break;
          }
        }
      }
    }
  }

  addEntity(entity: GameEntity) {
    this.entities.push(entity);
  }
}
