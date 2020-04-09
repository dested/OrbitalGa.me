import {PlayerShieldEntity, PlayerShieldModel} from '@common/entities/playerShieldEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {Entity} from '@common/entities/entity';
import {GameRules} from '@common/game/gameRules';
import {OrbitalAssets} from '../../utils/assetManager';

export class ClientPlayerShieldEntity extends PlayerShieldEntity implements ClientEntity {
  zIndex = DrawZIndex.Effect;

  constructor(game: ClientGame, messageEntity: PlayerShieldModel) {
    super(game, messageEntity.entityId, messageEntity.ownerEntityId, messageEntity.shieldStrength);
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

  draw(context: CanvasRenderingContext2D): void {
    const owner = this.game.entities.lookup(this.ownerEntityId);
    if (!owner) {
      return;
    }

    const shield = this.getShieldAsset();
    context.save();
    context.translate(this.drawX, this.drawY);
    context.globalAlpha = this.health / GameRules.playerShield[this.shieldStrength].maxHealth;
    context.drawImage(shield.image, -shield.size.width / 2, -shield.size.height / 2);
    context.restore();
  }

  tick() {}

  private getShieldAsset() {
    switch (this.shieldStrength) {
      case 'small':
        return OrbitalAssets.assets['Effects.shield1'];
      case 'medium':
        return OrbitalAssets.assets['Effects.shield2'];
      case 'big':
        return OrbitalAssets.assets['Effects.shield3'];
    }
  }
}
