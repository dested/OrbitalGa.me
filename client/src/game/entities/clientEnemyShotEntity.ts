import {EnemyShotEntity, EnemyShotModel} from '@common/entities/enemyShotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {Entity} from '@common/entities/entity';

export class ClientEnemyShotEntity extends EnemyShotEntity implements ClientEntity {
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
  tick() {}

  constructor(game: ClientGame, messageEntity: EnemyShotModel) {
    super(game, messageEntity.entityId, messageEntity.ownerEntityId);

    this.x = messageEntity.x;
    this.y = messageEntity.y;

    if (messageEntity.create) {
      this.y = 6;
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: 6,
      });
    }
    this.updatePolygon();
  }

  zIndex = DrawZIndex.Ordinance;
  draw(context: CanvasRenderingContext2D): void {
    const laserRed = AssetManager.assets['laser.red'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Math.PI);
    context.drawImage(laserRed.image, -laserRed.size.width / 2, -laserRed.size.height / 2);
    context.restore();
  }
}
