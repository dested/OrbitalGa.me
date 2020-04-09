import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {SpectatorEntity, SpectatorModel} from '@common/entities/spectatorEntity';

export class ClientSpectatorEntity extends SpectatorEntity implements ClientEntity {
  zIndex = DrawZIndex.Ordinance;
  constructor(game: ClientGame, messageEntity: SpectatorModel) {
    super(game, messageEntity.entityId);
    game.spectatorEntity = this;
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    if (messageEntity.create) {
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: this.y,
      });
    }
    this.updatePolygon();
  }
  get drawX() {
    return this.x;
  }
  get drawY() {
    return this.y;
  }
  draw(context: CanvasRenderingContext2D): void {}
  tick() {}
}
