import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';

export class ShotExplosionEntity extends Entity {
  boundingBox = {width: 0, height: 0};

  get realX() {
    return this.x + (this.game.entities.lookup(this.ownerEntityId)?.x ?? 0);
  }
  get realY() {
    return this.y + (this.game.entities.lookup(this.ownerEntityId)?.y ?? 0);
  }

  constructor(game: Game, entityId: number, public ownerEntityId: number) {
    super(game, entityId, 'shotExplosion');
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }

  static totalAliveDuration = 5;
  aliveDuration = ShotExplosionEntity.totalAliveDuration;
  tick(duration: number) {
    this.aliveDuration -= 1;
    if (this.aliveDuration <= 0) {
      this.game.destroyEntity(this);
    }
  }
  serialize(): ShotExplosionModel {
    return {
      x: this.x,
      y: this.y,
      realX: this.realX,
      realY: this.realY,
      entityId: this.entityId,
      aliveDuration: this.aliveDuration,
      ownerEntityId: this.ownerEntityId,
      entityType: 'shotExplosion',
    };
  }
}

export type ShotExplosionModel = EntityModel & {
  entityType: 'shotExplosion';
  aliveDuration: number;
  ownerEntityId: number;
};
