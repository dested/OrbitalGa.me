import {EnemyShotEntity, EnemyShotModel} from '@common/entities/enemyShotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {Entity} from '@common/entities/entity';
import {OrbitalAssets} from '../../utils/assetManager';

export class ClientEnemyShotEntity extends EnemyShotEntity implements ClientEntity {
  zIndex = DrawZIndex.Ordinance;

  constructor(game: ClientGame, messageEntity: EnemyShotModel) {
    super(game, messageEntity.entityId);

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
  draw(context: CanvasRenderingContext2D): void {
    const laserRed = OrbitalAssets.assets['Lasers.laserRed03'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Math.PI);
    context.drawImage(laserRed.image, -laserRed.size.width / 2, -laserRed.size.height / 2);
    context.restore();
  }
  tick() {}
}
