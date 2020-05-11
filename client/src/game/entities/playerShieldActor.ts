import {PlayerShieldEntity, PlayerShieldModel} from '@common/entities/playerShieldEntity';
import {ClientActor, DrawZIndex} from '@common/baseEntities/clientActor';
import {Entity} from '@common/baseEntities/entity';
import {GameRules} from '@common/game/gameRules';
import {OrbitalAssets} from '../../utils/assetManager';
import {OrbitalGame} from '@common/game/game';
import {PhysicsEntity} from '@common/baseEntities/physicsEntity';

export class PlayerShieldActor extends ClientActor<PlayerShieldEntity> {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Effect;

  get drawX() {
    const owner = this.entity.game.entities.lookup<PhysicsEntity>(this.entity.ownerEntityId);
    if (!owner) {
      return this.entity.position.x;
    }
    return this.entity.position.x + owner.position.x;
  }
  get drawY() {
    const owner = this.entity.game.entities.lookup<PhysicsEntity>(this.entity.ownerEntityId);
    if (!owner) {
      return this.entity.position.y;
    }
    return this.entity.position.y + owner.position.y;
  }

  draw(context: CanvasRenderingContext2D): void {
    const owner = this.entity.game.entities.lookup(this.entity.ownerEntityId);
    if (!owner) {
      return;
    }

    const shield = this.getShieldAsset();
    context.save();
    context.translate(this.drawX, this.drawY);
    context.globalAlpha = this.entity.health / GameRules.playerShield[this.entity.shieldStrength].maxHealth;
    context.drawImage(shield.image, -shield.size.width / 2, -shield.size.height / 2);
    context.restore();
  }

  tick() {}

  private getShieldAsset() {
    switch (this.entity.shieldStrength) {
      case 'small':
        return OrbitalAssets.assets['Effects.shield1'];
      case 'medium':
        return OrbitalAssets.assets['Effects.shield2'];
      case 'big':
        return OrbitalAssets.assets['Effects.shield3'];
    }
  }
}
