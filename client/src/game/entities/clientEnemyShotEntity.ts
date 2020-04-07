import {EnemyShotEntity, EnemyShotModel} from '@common/entities/enemyShotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';

export class ClientEnemyShotEntity extends EnemyShotEntity implements ClientEntity {
  get drawX() {
    return this.realX;
  }
  get drawY() {
    return this.realY;
  }
  constructor(game: ClientGame, messageEntity: EnemyShotModel) {
    super(game, messageEntity.entityId, messageEntity.startY);

    this.x = messageEntity.x;
    this.y = messageEntity.y;
    if (messageEntity.create) {
      this.y = messageEntity.startY;
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: messageEntity.startY,
      });
    }
    this.updatePolygon();
  }

  zIndex = DrawZIndex.Ordinance;
  draw(context: CanvasRenderingContext2D): void {
    const laserRed = AssetManager.assets['laser.red'];
    context.save();
    context.translate(this.realX, this.realY);
    context.rotate(Math.PI);
    context.drawImage(laserRed.image, -laserRed.size.width / 2, -laserRed.size.height / 2);
    context.restore();
  }
}
