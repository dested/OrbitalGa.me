import {Polygon, Result} from 'collisions';
import {Utils} from '../../utils/utils';
import {Game} from '../game';
import {EntityOptions, SerializedEntity} from '../types';

export abstract class GameEntity {
  polygon: Polygon | null;

  protected constructor(protected game: Game, options: EntityOptions) {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
  }

  x: number;
  y: number;
  id: string;

  abstract serialize(): SerializedEntity;

  destroy(): void {
    this.game.entities.splice(this.game.entities.findIndex(a => a.id === this.id), 1);
    this.game.collisionEngine.remove(this.polygon!);
    this.polygon = null;
  }

  abstract tick(timeSinceLastTick: number, timeSinceLastServerTick: number, currentServerTick: number): void;

  abstract serverTick(serverTick: number): void;

  abstract collide(otherEntity: GameEntity, collisionResult: Result): boolean;

  updatePolygon(): void {
    if (!this.polygon) {
      return;
    }
    this.x = Utils.round(this.x, 1);
    this.y = Utils.round(this.y, 1);
    this.polygon.x = this.x;
    this.polygon.y = this.y;
  }

  abstract draw(context: CanvasRenderingContext2D): void;
}
