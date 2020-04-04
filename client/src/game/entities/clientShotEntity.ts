import {ShotEntity, ShotModel} from '@common/entities/shotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';

export class ClientShotEntity extends ShotEntity implements ClientEntity {
  constructor(game: ClientGame, messageEntity: ShotModel) {
    super(
      game,
      messageEntity.entityId,
      messageEntity.ownerEntityId,
      messageEntity.shotOffsetX,
      messageEntity.shotOffsetY
    );

    this.x = messageEntity.x;
    this.y = messageEntity.y;
    if (messageEntity.create) {
      this.x = this.ownerEntityId === game.liveEntity?.entityId ? game.liveEntity.drawX! : messageEntity.x;
      this.y = this.ownerEntityId === game.liveEntity?.entityId ? game.liveEntity.drawY! : messageEntity.y;
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: this.y,
      });
    }
    this.updatePosition();
  }

  zIndex = DrawZIndex.Ordinance;
  draw(context: CanvasRenderingContext2D): void {
    const laserBlue = AssetManager.assets['laser.blue'];
    context.save();
    context.translate(this.x + this.shotOffsetX, this.y + this.shotOffsetY);
    context.drawImage(laserBlue.image, -laserBlue.size.width / 2, -laserBlue.size.height / 2);
    context.restore();
  }
}
