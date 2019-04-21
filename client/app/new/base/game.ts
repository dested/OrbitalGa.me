import {Collisions, Polygon, Result} from 'collisions';
import {GameEntity} from './entities/gameEntity';
import {PlayerEntity} from './entities/playerEntity';

export class Game {
  static tickRate = 50;

  collisionEngine: Collisions;
  entities: GameEntity[] = [];
  readonly collisionResult: Result;

  get playerEntities(): PlayerEntity[] {
    return this.entities.filter(a => a instanceof PlayerEntity).map(a => a as PlayerEntity);
  }

  get nonPlayerEntities(): GameEntity[] {
    return this.entities.filter(a => !(a instanceof PlayerEntity));
  }

  // public world:GameWord;

  constructor() {
    this.collisionEngine = new Collisions();
    const boardSize = 500;
    this.collisionEngine.insert(new Polygon(-20, 0, [[0, 0], [20, 0], [20, boardSize], [0, boardSize]]));
    this.collisionEngine.insert(new Polygon(boardSize, 0, [[0, 0], [20, 0], [20, boardSize], [0, boardSize]]));
    this.collisionEngine.insert(new Polygon(0, -20, [[0, 0], [0, 20], [boardSize, 20], [boardSize, 0]]));
    this.collisionEngine.insert(new Polygon(0, boardSize, [[0, 0], [0, 20], [boardSize, 20], [boardSize, 0]]));
    this.collisionResult = this.collisionEngine.createResult();
  }

  protected checkCollisions(solidOnly: boolean) {
    this.collisionEngine.update();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (!entity) {
        continue;
      }
      entity.checkCollisions(solidOnly);
    }
  }

  addEntity(entity: GameEntity) {
    this.entities.push(entity);
  }
}
