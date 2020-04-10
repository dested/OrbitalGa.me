import {RocketEntity, RocketModel} from '@common/entities/rocketEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {OrbitalAssets} from '../../utils/assetManager';
import {ClientPlayerEntity} from './clientPlayerEntity';

export class ClientRocketEntity extends RocketEntity implements ClientEntity {
  zIndex = DrawZIndex.Ordinance;

  constructor(game: ClientGame, messageModel: RocketModel) {
    super(game, messageModel.entityId, messageModel.ownerEntityId, messageModel.offsetX, messageModel.startY);

    this.x = messageModel.x;
    this.y = messageModel.y;
    if (messageModel.create) {
      if (this.owner && this.owner === game.liveEntity && game.liveEntity) {
        this.x = this.owner.x + this.offsetX;
      }
      this.y = messageModel.startY;
      this.positionBuffer.push({
        time: +new Date() - GameConstants.serverTickRate,
        x: this.x,
        y: messageModel.startY,
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

  get owner() {
    return this.game.entities.lookup<ClientPlayerEntity>(this.ownerEntityId);
  }

  draw(context: CanvasRenderingContext2D): void {
    const laserBlue = OrbitalAssets.assets['Missiles.spaceMissiles_001'];
    context.save();
    context.translate(this.drawX, this.drawY);
    context.drawImage(laserBlue.image, -laserBlue.size.width / 2, -laserBlue.size.height / 2);
    context.restore();
  }
  tick() {}
}
