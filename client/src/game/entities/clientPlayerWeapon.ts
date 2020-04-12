import {PlayerWeaponEntity, ShotModel} from '@common/entities/playerWeaponEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {GameConstants} from '@common/game/gameConstants';
import {OrbitalAssets} from '../../utils/assetManager';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {unreachable} from '@common/utils/unreachable';

export class ClientPlayerWeapon extends PlayerWeaponEntity implements ClientEntity {
  zIndex = DrawZIndex.Ordinance;

  constructor(game: ClientGame, messageModel: ShotModel) {
    super(
      game,
      messageModel.entityId,
      messageModel.ownerEntityId,
      messageModel.offsetX,
      messageModel.startY,
      messageModel.weaponType
    );

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

  get asset() {
    switch (this.weaponType) {
      case 'rocket':
        return OrbitalAssets.assets['Missiles.spaceMissiles_001'];
      case 'laser':
        return OrbitalAssets.assets['Lasers.laserBlue02'];
      case 'torpedo':
        return OrbitalAssets.assets['Missiles.spaceMissiles_004'];
      default:
        throw unreachable(this.weaponType);
    }
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
    const asset = this.asset;
    context.save();
    context.translate(this.drawX, this.drawY);
    context.drawImage(asset.image, -asset.size.width / 2, -asset.size.height / 2);
    context.restore();
  }
  tick() {}
}
