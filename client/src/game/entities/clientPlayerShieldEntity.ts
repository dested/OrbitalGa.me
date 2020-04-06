import {PlayerShieldEntity, PlayerShieldModel} from '@common/entities/playerShieldEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {ShakeGame} from '../../utils/shakeUtils';
import {PlayerEntity} from '@common/entities/playerEntity';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {LivePlayerEntity} from './livePlayerEntity';

export class ClientPlayerShieldEntity extends PlayerShieldEntity implements ClientEntity {
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
      ShakeGame(5);
    }
    this.updatePosition();
  }

  zIndex = DrawZIndex.Effect;
  draw(context: CanvasRenderingContext2D): void {
    const owner = this.game.entities.lookup<LivePlayerEntity>(this.ownerEntityId);
    if (!owner) {
      return;
    }

    const shield = AssetManager.assets['shield.1'];
    context.save();

    context.translate(owner.drawX + this.x, owner.drawY + this.y);
    // console.log(this.entityId, this.aliveDuration);
    context.drawImage(shield.image, -shield.size.width / 2, -shield.size.height / 2);
    context.restore();
  }
}
