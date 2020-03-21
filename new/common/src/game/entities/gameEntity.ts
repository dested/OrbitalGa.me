import {Polygon, Result} from 'collisions';
import {Utils} from '../../utils/utils';
import {Game} from '../game';
import {EntityOptions, LightSerializedEntity, SerializedEntity} from '../types';

export abstract class GameEntity {
  polygon: Polygon | null;
  willDestroy: boolean;
  clientDeath: boolean;

  protected constructor(protected game: Game, options: EntityOptions) {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.isClient = options.isClient;
  }

  x: number;
  y: number;
  id: string;
  isClient: boolean;

  abstract serialize(): SerializedEntity;
  abstract serializeLight(): LightSerializedEntity;

  destroy(): void {
    if (!this.clientDeath) {
      this.game.entities.splice(
        this.game.entities.findIndex(a => a.id === this.id),
        1
      );
    }
    if (this.polygon) {
      this.game.collisionEngine.remove(this.polygon!);
      this.polygon = null;
    }
  }

  queueDestroy(): void {
    this.willDestroy = true;
  }

  abstract tick(timeSinceLastTick: number, timeSinceLastServerTick: number, currentServerTick: number): void;

  abstract serverTick(serverTick: number): void;
  abstract lockTick(serverTick: number): void;

  abstract collide(otherEntity: GameEntity, collisionResult: Result, solidOnly: boolean): boolean;

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

  checkCollisions(solidOnly: boolean) {
    const potentials = this.polygon.potentials();
    for (const body of potentials) {
      if (this.polygon && this.polygon.collides(body, this.game.collisionResult)) {
        const e1 = this.collide(body.entity, this.game.collisionResult, solidOnly);
        if (e1) {
          break;
        }
      }
    }
  }
}
