import {EnemyShotEntity} from '@common/entities/enemyShotEntity';
import {DrawZIndex} from '@common/baseEntities/clientActor';
import {OrbitalAssets} from '../../utils/assetManager';
import {ClientActor} from '@common/baseEntities/clientActor';

export class EnemyShotActor extends ClientActor<EnemyShotEntity> {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Ordinance;

  get drawX() {
    return this.entity.position.x;
  }
  get drawY() {
    return this.entity.position.y;
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
