import {ShotExplosionEntity, ShotExplosionModel} from '@common/entities/shotExplosionEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {ShakeGame} from '../../utils/shakeUtils';
import {PlayerShieldEntity} from '@common/entities/playerShieldEntity';
import {Entity} from '@common/entities/entity';

export class ClientShotExplosionEntity extends ShotExplosionEntity implements ClientEntity {
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

  constructor(game: ClientGame, messageEntity: ShotExplosionModel) {
    super(game, messageEntity.entityId, messageEntity.ownerEntityId);
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.aliveDuration = messageEntity.aliveDuration;
    if (messageEntity.create) {
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: this.y,
      });
      ShakeGame(5);
    }
    this.updatePolygon();
  }

  zIndex = DrawZIndex.Effect;
  draw(context: CanvasRenderingContext2D): void {
    const blueExplosion = AssetManager.assets['laser.blue.explosion'];
    context.save();

    context.translate(this.drawX, this.drawY);
    context.rotate(Math.PI * 2 * (this.aliveDuration / ShotExplosionEntity.totalAliveDuration));
    context.drawImage(blueExplosion.image, -blueExplosion.size.width / 2, -blueExplosion.size.height / 2);
    context.restore();
  }
}
