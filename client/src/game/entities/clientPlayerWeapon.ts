import {PlayerWeaponEntity, PlayerWeaponModel} from '@common/entities/playerWeaponEntity';
import {ClientEntity, DrawZIndex} from './clientEntity';
import {ClientGame} from '../clientGame';
import {OrbitalAssets} from '../../utils/assetManager';
import {ClientPlayerEntity} from './clientPlayerEntity';
import {unreachable} from '@common/utils/unreachable';
import {Utils} from '@common/utils/utils';
import {GameConstants} from '@common/game/gameConstants';
import {WeaponConfigs} from '@common/game/gameRules';

export class ClientPlayerWeapon extends PlayerWeaponEntity implements ClientEntity {
  clientDestroyedTick?: number = undefined;
  zIndex = DrawZIndex.Ordinance;

  constructor(private clientGame: ClientGame, messageModel: PlayerWeaponModel) {
    super(clientGame, messageModel);
  }

  get asset() {
    switch (this.weaponType) {
      case 'rocket':
        return OrbitalAssets.assets['Missiles.spaceMissiles_001'];
      case 'laser1':
        return OrbitalAssets.assets['Lasers.laserBlue03'];
      case 'laser1Spray10':
        return OrbitalAssets.assets['Lasers.laserBlue03'];
      case 'laser2':
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
  destroyClient(): void {}

  draw(context: CanvasRenderingContext2D): void {
    const asset = this.asset;
    context.save();
    context.translate(this.drawX, this.drawY);
    this.drawFire(context);
    if (this.sprayAngle > 0) {
      context.rotate(Utils.degToRad(90 + this.sprayAngle));
    }
    context.drawImage(asset.image, -asset.size.width / 2, -asset.size.height / 2);
    context.restore();
  }

  drawFire(context: CanvasRenderingContext2D) {
    const asset = this.asset;
    switch (this.weaponType) {
      case 'rocket': {
        const fire =
          this.clientGame.drawTick % 8 < 4
            ? OrbitalAssets.assets['Effects.fire14']
            : OrbitalAssets.assets['Effects.fire15'];
        context.drawImage(fire.image, -fire.size.width / 2, asset.size.height / 2);
        break;
      }
      case 'laser1Spray10':
      case 'laser1':
      case 'laser2':
        break;
      case 'torpedo': {
        const fire =
          this.clientGame.drawTick % 8 < 4
            ? OrbitalAssets.assets['Effects.fire14']
            : OrbitalAssets.assets['Effects.fire15'];
        context.drawImage(fire.image, -fire.size.width / 2, asset.size.height / 2);
        break;
      }
      default:
        unreachable(this.weaponType);
        break;
    }
  }

  reconcileFromServer(messageModel: PlayerWeaponModel) {
    super.reconcileFromServer(messageModel);
    if (messageModel.create) {
      if (this.owner && this.owner === this.clientGame.liveEntity && this.clientGame.liveEntity) {
        this.x = this.owner.x + this.offsetX;
        this.y = this.owner.y;
        this.positionBuffer[0].x = this.x;
        this.positionBuffer[0].y = this.y;
        if (this.sprayAngle > 0) {
          const config = WeaponConfigs[this.weaponType];
          this.positionBuffer[1].x =
            this.x - Math.cos(Utils.degToRad(this.sprayAngle)) * config.speed * (GameConstants.serverTickRate / 1000);
          this.positionBuffer[1].y =
            this.y - Math.sin(Utils.degToRad(this.sprayAngle)) * config.speed * (GameConstants.serverTickRate / 1000);
        }
      } else {
        this.y = messageModel.startY;
        this.positionBuffer[0].y = messageModel.startY;
      }
    }
  }

  tick() {}
}
