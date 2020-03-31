import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity} from './entity';

export class ShotEntity extends Entity {
  boundingBox = {width: 9, height: 57};

  constructor(game: Game, entityId: number) {
    super(game, entityId, 'shot');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    if (otherEntity instanceof WallEntity) {
      this.game.destroyEntity(this);
      return true;
    }
    return false;
  }

  shotSpeedPerSecond = 1000;
  aliveDuration = 3000;

  tick(duration: number) {
    this.y -= this.shotSpeedPerSecond * (duration / 1000);
    this.aliveDuration -= duration;
    this.updatePosition();
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }
}
