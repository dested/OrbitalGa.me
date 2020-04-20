import {ExplosionEntity, ExplosionModel} from '@common/entities/explosionEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {ShakeGame} from '../../utils/shakeUtils';
import {Entity} from '@common/entities/entity';
import {Utils} from '@common/utils/utils';
import {OrbitalAssets} from '../../utils/assetManager';

export class ClientExplosionEntity extends ExplosionEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined
  rotate = Math.random() * 360;

  zIndex = DrawZIndex.Effect;

  constructor(game: ClientGame, messageModel: ExplosionModel) {
    super(game, messageModel);
    if (messageModel.create) {
      if (!('isBot' in game)) {
        ShakeGame(messageModel.intensity);
      }
    }
    this.updatePolygon();
  }
  get drawX() {
    const owner = this.ownerEntityId && this.game.entities.lookup<Entity & ClientEntity>(this.ownerEntityId);
    if (!owner) {
      return this.x;
    }
    return this.x + owner.drawX;
  }
  get drawY() {
    const owner = this.ownerEntityId && this.game.entities.lookup<Entity & ClientEntity>(this.ownerEntityId);
    if (!owner) {
      return this.y;
    }
    return this.y + owner.drawY;
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
