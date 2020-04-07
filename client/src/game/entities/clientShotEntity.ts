import {ShotEntity, ShotModel} from '@common/entities/shotEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {AssetManager} from '../../utils/assetManager';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';

export class ClientShotEntity extends ShotEntity implements ClientEntity {
  get drawX() {
    return this.realX;
  }
  get drawY() {
    return this.realY;
  }
  constructor(game: ClientGame, messageEntity: ShotModel) {
    super(
      game,
      messageEntity.entityId,
      messageEntity.ownerEntityId,
      messageEntity.shotOffsetX,
      messageEntity.shotOffsetY,
      messageEntity.startY
    );

    this.x = messageEntity.x;
    this.y = messageEntity.y;

    if (messageEntity.create) {
      const isLiveEntityShot = this.ownerEntityId === game.liveEntity?.entityId;
      this.x = isLiveEntityShot ? game.liveEntity!.drawX! : messageEntity.x;
      this.y = isLiveEntityShot ? game.liveEntity!.drawY! : messageEntity.startY;
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: isLiveEntityShot ? this.y : messageEntity.startY,
      });
    }
    this.updatePolygon();
  }

  zIndex = DrawZIndex.Ordinance;
  draw(context: CanvasRenderingContext2D): void {
    const laserBlue = AssetManager.assets['laser.blue'];
    context.save();
    context.translate(this.realX, this.realY);
    context.drawImage(laserBlue.image, -laserBlue.size.width / 2, -laserBlue.size.height / 2);
    context.restore();
  }
}
