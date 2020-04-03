import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';

export class EnemyShotEntity extends Entity {
  boundingBox = {width: 9, height: 57};

  constructor(game: Game, entityId: number) {
    super(game, entityId, 'enemyShot');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.game.destroyEntity(this);
      return true;
    }
    return false;
  }

  shotSpeedPerSecond = 900;
  aliveDuration = 3000;

  tick(duration: number) {
    this.y += this.shotSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    this.updatePosition();
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }
  serialize(): EnemyShotModel {
    return {
      x: this.x,
      y: this.y,
      entityId: this.entityId,
      entityType: 'enemyShot',
    };
  }
}

export type EnemyShotModel = EntityModel & {
  entityType: 'enemyShot';
};
