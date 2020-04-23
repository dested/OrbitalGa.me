import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {SpectatorEntity, SpectatorModel} from '@common/entities/spectatorEntity';

export class ClientSpectatorEntity extends SpectatorEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Ordinance;
  constructor(game: ClientGame, messageModel: SpectatorModel) {
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
