import {Entity} from './entity';

export abstract class ClientActor<TEntity extends Entity> {
  clientDestroyedTick?: number = undefined;
  abstract zIndex: DrawZIndex;
  constructor(public entity: TEntity) {}
  destroyClient(): void {
    this.clientDestroyedTick = this.entity.game.stepCount;
  }

  abstract draw(context: CanvasRenderingContext2D): void;
  staticDraw(context: CanvasRenderingContext2D): void {}
  tick(duration: number): void {}
}

export enum DrawZIndex {
  Ordinance = -50,
  Player = 50,
  Scenery = 100,
  Effect = 200,
}
