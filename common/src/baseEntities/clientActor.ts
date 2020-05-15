import {Entity, EntityModel} from './entity';
import {Engine} from '../game/game';

export abstract class ClientActor<TEntity extends Entity> {
  clientDestroyedTick?: number = undefined;
  abstract zIndex: DrawZIndex;
  constructor(public clientEngine: Engine, public entity: TEntity) {}
  destroyClient(): void {
    if (this.clientDestroyedTick === undefined) this.clientDestroyedTick = 5;
  }
  abstract draw(context: CanvasRenderingContext2D): void;
  reconcileFromServer(messageModel: EntityModel): void {}
  staticDraw(context: CanvasRenderingContext2D): void {}
  tick(duration: number): void {}
}

export enum DrawZIndex {
  Ordinance = -50,
  Player = 50,
  Scenery = 100,
  Effect = 200,
}
