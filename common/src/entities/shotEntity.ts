import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {WallEntity} from './wallEntity';
import {Entity, EntityModel} from './entity';

export class ShotEntity extends Entity {
  boundingBox = {width: 9, height: 57};

  get realX() {
    return this.x + this.shotOffsetX;
  }
  get realY() {
    return this.y + this.shotOffsetY;
  }

  constructor(
    game: Game,
    entityId: number,
    public ownerEntityId: number,
    public shotOffsetX: number,
    public shotOffsetY: number
  ) {
    super(game, entityId, 'shot');
    this.createPolygon(this.x + this.shotOffsetX, this.y + this.shotOffsetY);
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
    this.updatePosition(this.x + this.shotOffsetX, this.y + this.shotOffsetY);
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }
  serialize(): ShotModel {
    return {
      x: this.x,
      y: this.y,
      shotOffsetX: this.shotOffsetX,
      shotOffsetY: this.shotOffsetY,
      entityId: this.entityId,
      ownerEntityId: this.ownerEntityId,
      entityType: 'shot',
    };
  }
}

export type ShotModel = EntityModel & {
  entityType: 'shot';
  ownerEntityId: number;
  shotOffsetX: number;
  shotOffsetY: number;
};
