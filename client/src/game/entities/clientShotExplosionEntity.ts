import {ShotExplosionEntity} from '@common/entities/shotExplosionEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';

export class ClientShotExplosionEntity extends ShotExplosionEntity implements ClientEntity {
  zIndex = DrawZIndex.Effect;
  draw(context: CanvasRenderingContext2D): void {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return;
    }

    const blueExplosion = AssetManager.assets['laser.blue.explosion'];
    context.save();

    context.translate(owner.x + this.x, owner.y + this.y);
    // console.log(this.entityId, this.aliveDuration);
    context.rotate(Math.PI * 2 * (this.aliveDuration / ShotExplosionEntity.totalAliveDuration));
    context.drawImage(blueExplosion.image, -blueExplosion.size.width / 2, -blueExplosion.size.height / 2);
    context.restore();
  }
}
