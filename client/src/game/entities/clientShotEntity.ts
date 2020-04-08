import {ShotEntity, ShotModel} from '@common/entities/shotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {Entity} from '@common/entities/entity';
import {OrbitalAssets} from '../../utils/assetManager';

export class ClientShotEntity extends ShotEntity implements ClientEntity {
  zIndex = DrawZIndex.Ordinance;

  constructor(game: ClientGame, messageEntity: ShotModel) {
    super(game, messageEntity.entityId, messageEntity.ownerEntityId, messageEntity.startY);

    this.x = messageEntity.x;
    this.y = messageEntity.y;
    if (messageEntity.create) {
      this.y = messageEntity.startY;
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: messageEntity.startY,
      });
    }
    this.updatePolygon();
  }
  get drawX() {
    return this.x;
  }
  get drawY() {
    return this.y;
  }

  draw(context: CanvasRenderingContext2D): void {
    const laserBlue = OrbitalAssets.assets['Lasers.laserBlue02'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.drawImage(laserBlue.image, -laserBlue.size.width / 2, -laserBlue.size.height / 2);
    context.restore();
  }
  tick() {}
}
