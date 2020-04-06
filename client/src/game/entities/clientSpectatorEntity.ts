import {EnemyShotEntity, EnemyShotModel} from '@common/entities/enemyShotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {SpectatorEntity, SpectatorModel} from '@common/entities/spectatorEntity';

export class ClientSpectatorEntity extends SpectatorEntity implements ClientEntity {
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
    this.updatePosition();
  }

  zIndex = DrawZIndex.Ordinance;
  draw(context: CanvasRenderingContext2D): void {}
}