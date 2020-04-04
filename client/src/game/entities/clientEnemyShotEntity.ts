import {EnemyShotEntity} from '@common/entities/enemyShotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';

export class ClientEnemyShotEntity extends EnemyShotEntity implements ClientEntity {
  zIndex = DrawZIndex.Ordinance;
  draw(context: CanvasRenderingContext2D): void {
    const laserRed = AssetManager.assets['laser.red'];
    context.save();
    context.translate(this.x, this.y);
    context.rotate(Math.PI);
    context.drawImage(laserRed.image, -laserRed.size.width / 2, -laserRed.size.height / 2);
    context.restore();
  }
}
