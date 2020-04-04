import {ShotEntity} from '@common/entities/shotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';

export class ClientShotEntity extends ShotEntity implements ClientEntity {
  zIndex = DrawZIndex.Ordinance;
  draw(context: CanvasRenderingContext2D): void {

    const laserBlue = AssetManager.assets['laser.blue'];
    context.save();
    context.translate(this.x + this.shotOffsetX, this.y + this.shotOffsetY);
    context.drawImage(laserBlue.image, -laserBlue.size.width / 2, -laserBlue.size.height / 2);
    context.restore();

  }
}
