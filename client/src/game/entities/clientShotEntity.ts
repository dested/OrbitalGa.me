import {ShotEntity, ShotModel} from '@common/entities/shotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {Entity} from '@common/entities/entity';

export class ClientShotEntity extends ShotEntity implements ClientEntity {
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

  constructor(game: ClientGame, messageEntity: ShotModel) {
    super(game, messageEntity.entityId, messageEntity.ownerEntityId);

    this.x = messageEntity.x;
    this.y = messageEntity.y;
    if (messageEntity.create) {
      this.y = -6;
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: -6,
      });
    }
    this.updatePolygon();
  }

  zIndex = DrawZIndex.Ordinance;
  draw(context: CanvasRenderingContext2D): void {
    const laserBlue = AssetManager.assets['laser.blue'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.drawImage(laserBlue.image, -laserBlue.size.width / 2, -laserBlue.size.height / 2);
    context.restore();
  }
}
