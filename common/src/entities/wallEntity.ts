import {Polygon, Result} from 'collisions';
import {Game} from '../game/game';
import {Entity, EntityModel} from './entity';

export class WallEntity extends Entity {
  boundingBox: {width: number; height: number};

  createPolygon(): void {
    this.polygon = new Polygon(this.x, this.y, [
      [0, 0],
      [this.width, 0],
      [this.width, this.height],
      [0, this.height],
    ]);
    this.polygon.entity = this;
    this.game.collisionEngine.insert(this.polygon);
  }

  gameTick(): void {}

  width: number;
  height: number;

  constructor(game: Game, entityId: number, width: number, height: number) {
    super(game, entityId, 'wall');
    this.width = width;
    this.height = height;
    this.boundingBox = {width: this.width, height: this.height};
    this.createPolygon();
  }

  collide(otherEntity: Entity, collisionResult: Result): boolean {
    return false;
  }
  serialize(): WallModel {
    return {
      ...super.serialize(),
      width: this.width,
      height: this.height,
      entityType: 'wall',
    };
  }
}
export type WallModel = EntityModel & {
  entityType: 'wall';
  width: number;
  height: number;
};
