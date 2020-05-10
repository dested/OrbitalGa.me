import {ExplosionEntity, ExplosionModel} from '@common/entities/explosionEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';

import {ShakeGame} from '../../utils/shakeUtils';
import {Entity} from '@common/baseEntities/entity';
import {Utils} from '@common/utils/utils';
import {OrbitalAssets} from '../../utils/assetManager';
import {OrbitalGame} from '@common/game/game';

export class ClientExplosionEntity extends ExplosionEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  rotate = Math.random() * 360;

  zIndex = DrawZIndex.Effect;

  constructor(game: OrbitalGame, messageModel: ExplosionModel) {
    super(game, messageModel);
    this.updatePolygon();
  }
  get drawX() {
    const owner = this.ownerEntityId && this.game.entities.lookup<Entity & ClientEntity>(this.ownerEntityId);
    if (!owner) {
      return this.position.x;
    }
    return this.position.x + owner.drawX;
  }
  get drawY() {
    const owner = this.ownerEntityId && this.game.entities.lookup<Entity & ClientEntity>(this.ownerEntityId);
    if (!owner) {
      return this.position.y;
    }
    return this.position.y + owner.drawY;
  }
  destroyClient(): void {}
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
