import {ClientEntity, DrawZIndex} from './clientEntity';

import {SpectatorEntity, SpectatorModel} from '@common/entities/spectatorEntity';
import {OrbitalGame} from '@common/game/game';

export class ClientSpectatorEntity extends SpectatorEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Ordinance;
  constructor(game: OrbitalGame, messageModel: SpectatorModel) {
    super(game, messageModel);
  }
  get drawX() {
    return this.position.x;
  }
  get drawY() {
    return this.position.y;
  }
  destroyClient(): void {}
  draw(context: CanvasRenderingContext2D): void {}
  tick() {}
}
