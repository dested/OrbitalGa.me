import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity} from './entity';

export class EnemyShotEntity extends Entity {
  createPolygon(): void {
    const h = 30;
    const w = 30;
    this.polygon = new Polygon(this.x, this.y, [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

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
}
