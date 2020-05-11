import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';

import {SpectatorEntity, SpectatorModel} from '@common/entities/spectatorEntity';

export class ClientSpectatorActor extends ClientActor<SpectatorEntity> {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Ordinance;

  get drawX() {
    return this.entity.position.x;
  }
  get drawY() {
    return this.entity.position.y;
  }

  draw(context: CanvasRenderingContext2D): void {}
  tick() {}
}
