import {EnemyShotEntity, EnemyShotModel} from '@common/entities/enemyShotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {Entity} from '@common/entities/entity';
import {OrbitalAssets} from '../../utils/assetManager';

export class ClientEnemyShotEntity extends EnemyShotEntity implements ClientEntity {
  zIndex = DrawZIndex.Ordinance;

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
    const laserRed = OrbitalAssets.assets['Lasers.laserRed03'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.rotate(Math.PI);
    context.drawImage(laserRed.image, -laserRed.size.width / 2, -laserRed.size.height / 2);
    context.restore();
  }
  tick() {}
}
