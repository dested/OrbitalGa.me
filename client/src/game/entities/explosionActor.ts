import {ExplosionEntity, ExplosionModel} from '@common/entities/explosionEntity';
import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';

import {ShakeGame} from '../../utils/shakeUtils';
import {Entity} from '@common/baseEntities/entity';
import {Utils} from '@common/utils/utils';
import {OrbitalAssets} from '../../utils/assetManager';
import {OrbitalGame} from '@common/game/game';

export class ExplosionActor extends ClientActor<ExplosionEntity> {
  clientDestroyedTick?: number = undefined;
  rotate = Math.random() * 360;

  zIndex = DrawZIndex.Effect;

  get drawX() {
    const owner = this.entity.ownerEntityId && this.entity.game.entities.lookup<Entity>(this.entity.ownerEntityId);
    if (!owner) {
      return this.entity.position.x;
    }
    return this.entity.position.x + this.entity.position.x;
  }
  get drawY() {
    const owner = this.entity.ownerEntityId && this.entity.game.entities.lookup<Entity>(this.entity.ownerEntityId);
    if (!owner) {
      return this.entity.position.y;
    }
    return this.entity.position.y + this.entity.position.y;
  }

  draw(context: CanvasRenderingContext2D): void {
    const blueExplosion = OrbitalAssets.assets['Lasers.laserBlue10'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Utils.degToRad(this.rotate * 4));
    context.drawImage(blueExplosion.image, -blueExplosion.size.width / 2, -blueExplosion.size.height / 2);
    context.restore();
  }
  tick() {
    this.rotate++;
  }
}
