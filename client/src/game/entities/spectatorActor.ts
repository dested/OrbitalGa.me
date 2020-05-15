import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';

import {SpectatorEntity} from '@common/entities/spectatorEntity';

export class SpectatorActor extends ClientActor<SpectatorEntity> {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Ordinance;

  draw(context: CanvasRenderingContext2D): void {}
  tick() {}
}
