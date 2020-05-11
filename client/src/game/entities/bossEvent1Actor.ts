import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';
import {BossEvent1Entity} from '@common/entities/bossEvent1Entity';

export class BossEvent1Actor extends ClientActor<BossEvent1Entity> {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Player;

  get drawX() {
    return this.entity.position.x;
  }

  get drawY() {
    return this.entity.position.y;
  }

  destroyClient(): void {
  }

  draw(context: CanvasRenderingContext2D): void {
  }

  tick() {
  }
}