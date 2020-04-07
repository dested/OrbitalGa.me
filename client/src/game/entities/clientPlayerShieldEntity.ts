import {PlayerShieldEntity, PlayerShieldModel} from '@common/entities/playerShieldEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {ShakeGame} from '../../utils/shakeUtils';
import {PlayerEntity} from '@common/entities/playerEntity';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {ClientLivePlayerEntity} from './clientLivePlayerEntity';
import {Entity} from '@common/entities/entity';

export class ClientPlayerShieldEntity extends PlayerShieldEntity implements ClientEntity {
  get drawX() {
    const owner = this.game.entities.lookup<Entity & ClientEntity>(this.ownerEntityId);
    if (!owner) {
      return this.x;
    }
    return this.x + owner.drawX;
  }
  get drawY() {
    const owner = this.game.entities.lookup<Entity & ClientEntity>(this.ownerEntityId);
    if (!owner) {
      return this.y;
    }
    return this.y + owner.drawY;
  }

  constructor(game: ClientGame, messageEntity: PlayerShieldModel) {
    super(game, messageEntity.entityId, messageEntity.ownerEntityId);
    this.x = messageEntity.x;
    this.y = messageEntity.y;
    this.health = messageEntity.health;
    if (messageEntity.create) {
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: this.y,
      });
    }
    this.updatePolygon();
  }

  zIndex = DrawZIndex.Effect;
  draw(context: CanvasRenderingContext2D): void {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return;
    }

    const shield = AssetManager.assets['shield.1'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.globalAlpha = this.health / ClientPlayerShieldEntity.startingHealth;

    context.drawImage(shield.image, -shield.size.width / 2, -shield.size.height / 2);
    context.restore();
  }
}
