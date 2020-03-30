import {Collisions, Result} from 'collisions';
import {Entity, EntityTypeOptions, EntityTypes, ShotEntity} from '../entities/entity';
import {uuid} from '../utils/uuid';

export abstract class Game {
  entities: Entity[] = [];
  collisionEngine: Collisions;
  readonly collisionResult: Result;

  constructor(public isClient: boolean) {
    this.collisionEngine = new Collisions();
    this.collisionResult = this.collisionEngine.createResult();
  }

  protected checkCollisions() {
    this.collisionEngine.update();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      entity.checkCollisions();
    }
  }

  abstract createEntity(entityType: EntityTypes, options: EntityTypeOptions[typeof entityType]): void;

  destroyEntity(entity: Entity) {
    entity.destroy();
  }
}
