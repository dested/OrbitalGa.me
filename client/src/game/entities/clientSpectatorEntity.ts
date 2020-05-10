import {ClientEntity, DrawZIndex} from './clientEntity';

import {SpectatorEntity, SpectatorModel} from '@common/entities/spectatorEntity';
import {OrbitalGame} from '@common/game/game';

export class ClientSpectatorEntity extends SpectatorEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Ordinance;
  constructor(game: OrbitalGame, messageModel: SpectatorModel) {
    super(game, messageModel);
    game.spectatorEntity = this;
  }
  get drawX() {
    return this.x;
  }
  get drawY() {
    return this.y;
  }
  destroyClient(): void {}
  draw(context: CanvasRenderingContext2D): void {}
  tick() {}
}
